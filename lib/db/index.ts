import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection
const connectionString = process.env.DATABASE_URL!

// For development, disable prefetch as it is not supported by Supabase
const client = postgres(connectionString, {
  prepare: false,
})

export const db = drizzle(client, { schema })

// Export schema types
export type Database = typeof db
export * from './schema'
