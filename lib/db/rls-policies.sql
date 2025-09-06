-- Row Level Security Policies for Healthcare Staffing MVP
-- These policies ensure proper data isolation and access control

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Organizations: Only org members can read their org data
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.org_id = organizations.id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT WITH CHECK (true); -- Allow org creation

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.org_id = organizations.id
      AND users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Users: Scoped access based on role and org membership
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    -- Users can see themselves
    id = auth.uid()
    OR
    -- Managers can see users in their org
    (EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = users.org_id
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    ))
    OR
    -- Professionals can see manager/coordinator contacts for messaging
    (role IN ('admin', 'manager', 'compliance_officer')
     AND EXISTS (
       SELECT 1 FROM users p
       WHERE p.id = auth.uid()
       AND p.role = 'professional'
       AND p.org_id IS NULL
     ))
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (
    -- Allow self-registration for professionals
    (role = 'professional' AND org_id IS NULL)
    OR
    -- Allow org admins to create users in their org
    (EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = users.org_id
      AND u.role = 'admin'
    ))
  );

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (
    -- Users can update themselves
    id = auth.uid()
    OR
    -- Org admins can update users in their org
    (EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = users.org_id
      AND u.role = 'admin'
    ))
  );

-- Profiles: Professionals can manage their own profiles
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = (SELECT org_id FROM users WHERE id = profiles.user_id)
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Credentials: Professionals manage their own, compliance officers verify
CREATE POLICY "credentials_select_policy" ON credentials
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = (SELECT org_id FROM users WHERE id = credentials.user_id)
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

CREATE POLICY "credentials_insert_policy" ON credentials
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "credentials_update_policy" ON credentials
  FOR UPDATE USING (
    user_id = auth.uid()
    OR
    -- Compliance officers can update verification status
    (EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = (SELECT org_id FROM users WHERE id = credentials.user_id)
      AND u.role = 'compliance_officer'
    ))
  );

-- Jobs: Org members can see their org's jobs
CREATE POLICY "jobs_select_policy" ON jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = jobs.org_id
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
    OR
    -- Professionals can see active jobs for applications
    (status = 'active' AND EXISTS (
      SELECT 1 FROM users p
      WHERE p.id = auth.uid()
      AND p.role = 'professional'
    ))
  );

CREATE POLICY "jobs_insert_policy" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = jobs.org_id
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "jobs_update_policy" ON jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = jobs.org_id
      AND u.role IN ('admin', 'manager')
    )
  );

-- Applications: Scoped to job org and applicant
CREATE POLICY "applications_select_policy" ON applications
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN users u ON u.org_id = j.org_id
      WHERE j.id = applications.job_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

CREATE POLICY "applications_insert_policy" ON applications
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users p
      WHERE p.id = auth.uid()
      AND p.role = 'professional'
    )
  );

CREATE POLICY "applications_update_policy" ON applications
  FOR UPDATE USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN users u ON u.org_id = j.org_id
      WHERE j.id = applications.job_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

-- Interviews: Scoped to application participants
CREATE POLICY "interviews_select_policy" ON interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = interviews.application_id
      AND (a.user_id = auth.uid()
           OR EXISTS (
             SELECT 1 FROM jobs j
             JOIN users u ON u.org_id = j.org_id
             WHERE j.id = a.job_id
             AND u.id = auth.uid()
             AND u.role IN ('admin', 'manager', 'compliance_officer')
           ))
    )
  );

CREATE POLICY "interviews_insert_policy" ON interviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u ON u.org_id = j.org_id
      WHERE a.id = interviews.application_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "interviews_update_policy" ON interviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = interviews.application_id
      AND (a.user_id = auth.uid()
           OR EXISTS (
             SELECT 1 FROM jobs j
             JOIN users u ON u.org_id = j.org_id
             WHERE j.id = a.job_id
             AND u.id = auth.uid()
             AND u.role IN ('admin', 'manager', 'compliance_officer')
           ))
    )
  );

-- Offers: Scoped to application participants
CREATE POLICY "offers_select_policy" ON offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = offers.application_id
      AND (a.user_id = auth.uid()
           OR EXISTS (
             SELECT 1 FROM jobs j
             JOIN users u ON u.org_id = j.org_id
             WHERE j.id = a.job_id
             AND u.id = auth.uid()
             AND u.role IN ('admin', 'manager', 'compliance_officer')
           ))
    )
  );

CREATE POLICY "offers_insert_policy" ON offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u ON u.org_id = j.org_id
      WHERE a.id = offers.application_id
      AND u.id = auth.uid()
      AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "offers_update_policy" ON offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = offers.application_id
      AND (a.user_id = auth.uid()
           OR EXISTS (
             SELECT 1 FROM jobs j
             JOIN users u ON u.org_id = j.org_id
             WHERE j.id = a.job_id
             AND u.id = auth.uid()
             AND u.role IN ('admin', 'manager')
           ))
    )
  );

-- Onboarding Tasks: Users can see their own tasks, managers see org tasks
CREATE POLICY "onboarding_tasks_select_policy" ON onboarding_tasks
  FOR SELECT USING (
    assignee_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = (SELECT org_id FROM users WHERE id = onboarding_tasks.assignee_id)
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

CREATE POLICY "onboarding_tasks_insert_policy" ON onboarding_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = (SELECT org_id FROM users WHERE id = onboarding_tasks.assignee_id)
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

CREATE POLICY "onboarding_tasks_update_policy" ON onboarding_tasks
  FOR UPDATE USING (
    assignee_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = (SELECT org_id FROM users WHERE id = onboarding_tasks.assignee_id)
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

-- Messages: Participants can see their conversation threads
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.org_id = (SELECT org_id FROM users WHERE id = messages.sender_id)
      AND u.role IN ('admin', 'manager', 'compliance_officer')
    )
  );

CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Events: Append-only audit log (no updates/deletes)
CREATE POLICY "events_select_policy" ON events
  FOR SELECT USING (
    -- Users can see events they created
    actor_id = auth.uid()
    OR
    -- Compliance officers can see all events in their org
    (EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'compliance_officer'
      AND u.org_id = (SELECT org_id FROM users WHERE id = events.actor_id)
    ))
  );

CREATE POLICY "events_insert_policy" ON events
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- No UPDATE or DELETE policies for events (append-only)
