import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NursysWebhookPayload {
  verificationId: string
  licenseNumber: string
  state: string
  status: 'verified' | 'not_found' | 'expired' | 'error'
  verificationDate: string
  expirationDate?: string
  metadata?: Record<string, any>
}

serve(async (req) => {
  try {
    // Verify webhook signature (implement based on Nursys API docs)
    const signature = req.headers.get('x-nursys-signature')
    if (!signature) {
      return new Response('Missing signature', { status: 401 })
    }

    const payload: NursysWebhookPayload = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find credential by license number and state
    const { data: credential, error: findError } = await supabase
      .from('credentials')
      .select('id, user_id, type, status')
      .eq('number', payload.licenseNumber)
      .eq('issuer', payload.state)
      .eq('type', 'license')
      .single()

    if (findError || !credential) {
      console.error('Credential not found:', payload.licenseNumber, payload.state)
      return new Response('Credential not found', { status: 404 })
    }

    // Update credential status
    const updateData: any = {
      status: payload.status === 'verified' ? 'verified' : 'rejected',
      verified_at: payload.status === 'verified' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    if (payload.expirationDate) {
      updateData.exp_date = payload.expirationDate
    }

    const { error: updateError } = await supabase
      .from('credentials')
      .update(updateData)
      .eq('id', credential.id)

    if (updateError) {
      console.error('Error updating credential:', updateError)
      return new Response('Update failed', { status: 500 })
    }

    // Log the event
    await supabase.from('events').insert({
      actor_id: null, // System event
      type: 'credential_verified',
      entity_table: 'credentials',
      entity_id: credential.id,
      payload_json: {
        verification_id: payload.verificationId,
        status: payload.status,
        verified_at: updateData.verified_at,
        source: 'nursys_webhook',
      },
    })

    // Trigger automations if status changed to verified
    if (payload.status === 'verified' && credential.status !== 'verified') {
      // Find applications that might be affected by this verification
      const { data: applications } = await supabase
        .from('applications')
        .select('id, job_id')
        .eq('user_id', credential.user_id)
        .in('stage', ['applied', 'shortlisted'])

      if (applications && applications.length > 0) {
        // Trigger matching recalculation
        await supabase.functions.invoke('automations_dispatcher', {
          body: {
            type: 'recalculate_matches',
            user_id: credential.user_id,
            applications: applications.map(app => app.id),
          },
        })
      }
    }

    return new Response('Webhook processed successfully', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
