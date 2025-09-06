import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AutomationPayload {
  type: string
  user_id?: string
  job_id?: string
  application_id?: string
  credential_id?: string
  task_id?: string
  [key: string]: any
}

serve(async (req) => {
  try {
    const payload: AutomationPayload = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (payload.type) {
      case 'credential_expiring':
        await handleCredentialExpiring(supabase, payload)
        break

      case 'new_job_matches':
        await handleNewJobMatches(supabase, payload)
        break

      case 'application_stage_changed':
        await handleApplicationStageChanged(supabase, payload)
        break

      case 'task_overdue':
        await handleTaskOverdue(supabase, payload)
        break

      case 'sla_breach':
        await handleSlaBreach(supabase, payload)
        break

      case 'recalculate_matches':
        await handleRecalculateMatches(supabase, payload)
        break

      default:
        console.error('Unknown automation type:', payload.type)
        return new Response('Unknown automation type', { status: 400 })
    }

    return new Response('Automation processed successfully', { status: 200 })

  } catch (error) {
    console.error('Automation processing error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

async function handleCredentialExpiring(supabase: any, payload: AutomationPayload) {
  const { credential_id } = payload

  // Get credential details
  const { data: credential } = await supabase
    .from('credentials')
    .select('user_id, type, issuer, exp_date')
    .eq('id', credential_id)
    .single()

  if (!credential) return

  // Notify user
  const message = `Your ${credential.type} from ${credential.issuer} expires on ${new Date(credential.exp_date).toLocaleDateString()}. Please renew to maintain compliance.`

  await supabase.from('messages').insert({
    thread_id: `credential_${credential_id}`,
    sender_id: null, // System message
    recipient_id: credential.user_id,
    body: message,
    channel: 'in_app',
  })

  // Log automation event
  await supabase.from('events').insert({
    actor_id: null,
    type: 'automation_triggered',
    entity_table: 'credentials',
    entity_id: credential_id,
    payload_json: {
      automation_type: 'credential_expiring',
      message_sent: true,
    },
  })
}

async function handleNewJobMatches(supabase: any, payload: AutomationPayload) {
  const { user_id, matches } = payload

  if (!matches || matches.length === 0) return

  // Get user preferences for notifications
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user_id)
    .single()

  if (!profile) return

  // Send weekly digest or immediate notifications based on score
  const highMatches = matches.filter((m: any) => m.fit_score >= 70)
  const mediumMatches = matches.filter((m: any) => m.fit_score >= 50 && m.fit_score < 70)

  if (highMatches.length > 0) {
    const message = `You have ${highMatches.length} new job matches with high fit scores! Check them out in your dashboard.`

    await supabase.from('messages').insert({
      thread_id: `matches_${user_id}_${Date.now()}`,
      sender_id: null,
      recipient_id: user_id,
      body: message,
      channel: 'in_app',
    })
  }

  // Log automation event
  await supabase.from('events').insert({
    actor_id: null,
    type: 'automation_triggered',
    entity_table: 'users',
    entity_id: user_id,
    payload_json: {
      automation_type: 'new_job_matches',
      high_matches: highMatches.length,
      total_matches: matches.length,
    },
  })
}

async function handleApplicationStageChanged(supabase: any, payload: AutomationPayload) {
  const { application_id, new_stage } = payload

  // Get application details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      user_id,
      job_id,
      jobs (
        title,
        organizations (
          name
        )
      )
    `)
    .eq('id', application_id)
    .single()

  if (!application) return

  // Generate onboarding checklist when moving to offer stage
  if (new_stage === 'offered') {
    await generateOnboardingChecklist(supabase, application_id, application.user_id)
  }

  // Send notification
  const stageMessages = {
    shortlisted: `Congratulations! You've been shortlisted for ${application.jobs.title} at ${application.jobs.organizations.name}.`,
    interview_scheduled: `Your interview for ${application.jobs.title} has been scheduled.`,
    offered: `You've received an offer for ${application.jobs.title}!`,
    accepted: `Welcome aboard! Your offer for ${application.jobs.title} has been accepted.`,
  }

  const message = stageMessages[new_stage as keyof typeof stageMessages]
  if (message) {
    await supabase.from('messages').insert({
      thread_id: `application_${application_id}`,
      sender_id: null,
      recipient_id: application.user_id,
      body: message,
      channel: 'in_app',
    })
  }

  // Log automation event
  await supabase.from('events').insert({
    actor_id: null,
    type: 'automation_triggered',
    entity_table: 'applications',
    entity_id: application_id,
    payload_json: {
      automation_type: 'application_stage_changed',
      new_stage,
      notification_sent: !!message,
    },
  })
}

async function generateOnboardingChecklist(supabase: any, applicationId: string, userId: string) {
  const checklistItems = [
    { type: 'background_check', description: 'Complete background check verification' },
    { type: 'drug_screen', description: 'Schedule and complete drug screening' },
    { type: 'vaccination', description: 'Provide vaccination records' },
    { type: 'license_verification', description: 'Verify professional licenses' },
    { type: 'emr_training', description: 'Complete EMR system training' },
    { type: 'orientation', description: 'Attend facility orientation' },
  ]

  const tasks = checklistItems.map(item => ({
    assignee_id: userId,
    type: item.type,
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    status: 'pending',
    meta_json: {
      application_id: applicationId,
      priority: 'high',
      description: item.description,
    },
  }))

  await supabase.from('onboarding_tasks').insert(tasks)
}

async function handleTaskOverdue(supabase: any, payload: AutomationPayload) {
  const { task_id } = payload

  // Get task details
  const { data: task } = await supabase
    .from('onboarding_tasks')
    .select('assignee_id, type, meta_json')
    .eq('id', task_id)
    .single()

  if (!task) return

  // Escalate to coordinator/manager
  const message = `Onboarding task overdue: ${task.meta_json.description}`

  // Find org coordinator
  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', task.assignee_id)
    .single()

  if (user?.org_id) {
    const { data: coordinators } = await supabase
      .from('users')
      .select('id')
      .eq('org_id', user.org_id)
      .in('role', ['admin', 'manager'])

    if (coordinators && coordinators.length > 0) {
      const notifications = coordinators.map(coord => ({
        thread_id: `task_${task_id}`,
        sender_id: null,
        recipient_id: coord.id,
        body: message,
        channel: 'in_app',
      }))

      await supabase.from('messages').insert(notifications)
    }
  }

  // Log automation event
  await supabase.from('events').insert({
    actor_id: null,
    type: 'automation_triggered',
    entity_table: 'onboarding_tasks',
    entity_id: task_id,
    payload_json: {
      automation_type: 'task_overdue',
      escalated: true,
    },
  })
}

async function handleSlaBreach(supabase: any, payload: AutomationPayload) {
  const { job_id, breach_type } = payload

  // Get job and org details
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      organizations (
        id,
        name
      )
    `)
    .eq('id', job_id)
    .single()

  if (!job) return

  // Notify managers
  const message = `SLA breach for ${job.title}: ${breach_type}`

  const { data: managers } = await supabase
    .from('users')
    .select('id')
    .eq('org_id', job.organizations.id)
    .in('role', ['admin', 'manager'])

  if (managers && managers.length > 0) {
    const notifications = managers.map(manager => ({
      thread_id: `sla_${job_id}`,
      sender_id: null,
      recipient_id: manager.id,
      body: message,
      channel: 'in_app',
    }))

    await supabase.from('messages').insert(notifications)
  }

  // Log automation event
  await supabase.from('events').insert({
    actor_id: null,
    type: 'automation_triggered',
    entity_table: 'jobs',
    entity_id: job_id,
    payload_json: {
      automation_type: 'sla_breach',
      breach_type,
      notifications_sent: managers?.length || 0,
    },
  })
}

async function handleRecalculateMatches(supabase: any, payload: AutomationPayload) {
  const { user_id, applications } = payload

  // This would trigger the matching engine
  // For now, we'll just log the event
  await supabase.from('events').insert({
    actor_id: null,
    type: 'automation_triggered',
    entity_table: 'users',
    entity_id: user_id,
    payload_json: {
      automation_type: 'recalculate_matches',
      applications_affected: applications?.length || 0,
    },
  })

  // TODO: Implement actual matching recalculation
}
