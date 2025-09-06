import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  uuid,
  boolean,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = ['professional', 'manager', 'admin', 'compliance_officer'] as const
export const credentialStatusEnum = ['pending', 'verified', 'expired', 'rejected'] as const
export const jobStatusEnum = ['draft', 'active', 'paused', 'filled', 'cancelled'] as const
export const applicationStageEnum = [
  'applied',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'offered',
  'accepted',
  'rejected',
  'withdrawn'
] as const
export const interviewStatusEnum = ['scheduled', 'completed', 'cancelled', 'no_show'] as const
export const offerStatusEnum = ['draft', 'sent', 'accepted', 'declined', 'expired'] as const
export const taskStatusEnum = ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'] as const
export const messageChannelEnum = ['in_app', 'email', 'sms'] as const

// Organizations table
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  billingJson: jsonb('billing_json').$type<{
    plan: string
    stripeCustomerId?: string
    billingEmail: string
  }>(),
  compliancePolicyJson: jsonb('compliance_policy_json').$type<{
    backgroundCheckRequired: boolean
    drugScreenRequired: boolean
    vaccinationRequired: boolean
    licenseVerificationRequired: boolean
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: userRoleEnum }).notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  piiJson: jsonb('pii_json').$type<{
    firstName?: string
    lastName?: string
    address?: string
    ssn?: string
    dateOfBirth?: string
  }>(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  orgIdx: index('users_org_idx').on(table.orgId),
  emailUnique: uniqueIndex('users_email_unique').on(table.email),
}))

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  specialty: text('specialty').notNull(),
  experienceYears: integer('experience_years').notNull(),
  skills: jsonb('skills').$type<string[]>().default([]).notNull(),
  prefsJson: jsonb('prefs_json').$type<{
    shiftTypes: string[]
    locationRadius: number
    payRangeMin: number
    payRangeMax: number
    contractType: 'w2' | '1099' | 'both'
    startDatePreference: string
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('profiles_user_unique').on(table.userId),
}))

// Credentials table
export const credentials = pgTable('credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'license', 'certification', 'background_check', etc.
  issuer: text('issuer').notNull(),
  number: text('number'),
  expDate: timestamp('exp_date'),
  status: text('status', { enum: credentialStatusEnum }).default('pending').notNull(),
  fileUrl: text('file_url'),
  verifiedAt: timestamp('verified_at'),
  verifierId: uuid('verifier_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('credentials_user_idx').on(table.userId),
  statusIdx: index('credentials_status_idx').on(table.status),
  expDateIdx: index('credentials_exp_date_idx').on(table.expDate),
}))

// Jobs table
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  unit: text('unit').notNull(),
  shift: text('shift').notNull(), // 'day', 'night', 'evening', etc.
  payBandJson: jsonb('pay_band_json').$type<{
    min: number
    max: number
    currency: string
  }>().notNull(),
  requirements: jsonb('requirements').$type<{
    specialty: string
    experienceYears: number
    licenses: string[]
    certifications: string[]
    skills: string[]
  }>().notNull(),
  status: text('status', { enum: jobStatusEnum }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('jobs_org_idx').on(table.orgId),
  statusIdx: index('jobs_status_idx').on(table.status),
}))

// Applications table
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stage: text('stage', { enum: applicationStageEnum }).default('applied').notNull(),
  fitScore: decimal('fit_score', { precision: 5, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  jobIdx: index('applications_job_idx').on(table.jobId),
  userIdx: index('applications_user_idx').on(table.userId),
  stageIdx: index('applications_stage_idx').on(table.stage),
  fitScoreIdx: index('applications_fit_score_idx').on(table.fitScore),
}))

// Interviews table
export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  slotTs: timestamp('slot_ts').notNull(),
  status: text('status', { enum: interviewStatusEnum }).default('scheduled').notNull(),
  feedbackJson: jsonb('feedback_json').$type<{
    interviewerId: string
    rating: number
    notes: string
    decision: 'advance' | 'reject' | 'hold'
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index('interviews_application_idx').on(table.applicationId),
  slotIdx: index('interviews_slot_idx').on(table.slotTs),
}))

// Offers table
export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  compJson: jsonb('comp_json').$type<{
    baseRate: number
    differential: number
    bonus: number
    contractType: 'w2' | '1099'
    benefits: string[]
  }>().notNull(),
  status: text('status', { enum: offerStatusEnum }).default('draft').notNull(),
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index('offers_application_idx').on(table.applicationId),
  statusIdx: index('offers_status_idx').on(table.status),
}))

// Onboarding Tasks table
export const onboardingTasks = pgTable('onboarding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'background_check', 'drug_screen', 'vaccination', etc.
  dueAt: timestamp('due_at'),
  status: text('status', { enum: taskStatusEnum }).default('pending').notNull(),
  metaJson: jsonb('meta_json').$type<{
    applicationId?: string
    jobId?: string
    priority: 'low' | 'medium' | 'high'
    description: string
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  assigneeIdx: index('onboarding_tasks_assignee_idx').on(table.assigneeId),
  statusIdx: index('onboarding_tasks_status_idx').on(table.status),
  dueAtIdx: index('onboarding_tasks_due_at_idx').on(table.dueAt),
}))

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: text('thread_id').notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  recipientId: uuid('recipient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  body: text('body').notNull(),
  channel: text('channel', { enum: messageChannelEnum }).default('in_app').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  threadIdx: index('messages_thread_idx').on(table.threadId),
  senderIdx: index('messages_sender_idx').on(table.senderId),
  recipientIdx: index('messages_recipient_idx').on(table.recipientId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
}))

// Events table (immutable audit log)
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ts: timestamp('ts').defaultNow().notNull(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  entityTable: text('entity_table').notNull(),
  entityId: uuid('entity_id').notNull(),
  payloadJson: jsonb('payload_json'),
  hash: text('hash'), // For integrity
  prevHash: text('prev_hash'), // Chain previous event
}, (table) => ({
  tsIdx: index('events_ts_idx').on(table.ts),
  actorIdx: index('events_actor_idx').on(table.actorId),
  typeIdx: index('events_type_idx').on(table.type),
  entityIdx: index('events_entity_idx').on(table.entityTable, table.entityId),
}))

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  jobs: many(jobs),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  profile: one(profiles),
  credentials: many(credentials),
  applications: many(applications),
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'recipient' }),
  onboardingTasks: many(onboardingTasks),
}))

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}))

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(users, {
    fields: [credentials.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [credentials.verifierId],
    references: [users.id],
  }),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [jobs.orgId],
    references: [organizations.id],
  }),
  applications: many(applications),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  interviews: many(interviews),
  offers: many(offers),
}))

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}))

export const offersRelations = relations(offers, ({ one }) => ({
  application: one(applications, {
    fields: [offers.applicationId],
    references: [applications.id],
  }),
}))

export const onboardingTasksRelations = relations(onboardingTasks, ({ one }) => ({
  assignee: one(users, {
    fields: [onboardingTasks.assigneeId],
    references: [users.id],
  }),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: 'recipient',
  }),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  actor: one(users, {
    fields: [events.actorId],
    references: [users.id],
  }),
}))
