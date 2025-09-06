import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CheckrWebhookPayload {
  id: string
  object: string
  type: string
  created_at: string
  data: {
    id: string
    object: string
    status: 'pending' | 'clear' | 'consider' | 'suspended'
    candidate_id: string
    report_id?: string
    result?: string
    package: string
    tags?: string[]
    completed_at?: string
  }
}

serve(async (req) => {
  try {
    // Verify webhook signature (implement based on Checkr API docs)
    const signature = req.headers.get('x-checkr-signature')
    if (!signature) {
      return new Response('Missing signature', { status: 401 })
    }

    const payload: CheckrWebhookPayload = await req.json()

    // Only process background check completion events
    if (payload.type !== 'background_check.completed') {
      return new Response('Event type not supported', { status: 200 })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find credential by checkr candidate_id or report_id
    const { data: credential, error: findError } = await supabase
      .from('credentials')
      .select('id, user_id, type, status')
      .eq('type', 'background_check')
      .or(`number.eq.${payload.data.candidate_id},number.eq.${payload.data.report_id}`)
      .single()

    if (findError || !credential) {
      console.error('Background check credential not found:', payload.data.candidate_id)
      return new Response('Credential not found', { status: 404 })
    }

    // Map Checkr status to our status
    const statusMap = {
      'pending': 'pending',
      'clear': 'verified',
      'consider': 'rejected',
      'suspended': 'rejected',
    }

    const newStatus = statusMap[payload.data.status] || 'rejected'

    // Update credential status
    const updateData = {
      status: newStatus,
      verified_at: payload.data.completed_at ? new Date(payload.data.completed_at).toISOString() : null,
      updated_at: new Date().toISOString(),
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
      type: 'background_check_completed',
      entity_table: 'credentials',
      entity_id: credential.id,
      payload_json: {
        checkr_id: payload.data.id,
        status: payload.data.status,
        result: payload.data.result,
        completed_at: payload.data.completed_at,
        source: 'checkr_webhook',
      },
    })

    // If background check passed, check if we need to update onboarding tasks
    if (newStatus === 'verified') {
      // Find onboarding tasks related to background checks for this user
      const { data: tasks } = await supabase
        .from('onboarding_tasks')
        .select('id')
        .eq('assignee_id', credential.user_id)
        .eq('type', 'background_check')
        .eq('status', 'pending')

      if (tasks && tasks.length > 0) {
        // Update tasks to completed
        await supabase
          .from('onboarding_tasks')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .in('id', tasks.map(t => t.id))

        // Log task completion events
        const events = tasks.map(task => ({
          actor_id: null,
          type: 'onboarding_task_completed',
          entity_table: 'onboarding_tasks',
          entity_id: task.id,
          payload_json: {
            completion_reason: 'background_check_verified',
            source: 'checkr_webhook',
          },
        }))

        await supabase.from('events').insert(events)
      }
    }

    return new Response('Webhook processed successfully', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
