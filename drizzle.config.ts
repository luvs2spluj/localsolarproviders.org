import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:Poosmells12!@db.qktumtzgbwsprueqqhsr.supabase.co:5432/postgres',
  },
  verbose: true,
  strict: true,
})
