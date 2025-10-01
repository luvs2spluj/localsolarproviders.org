import { pgTable, uuid, varchar, text, integer, decimal, timestamp, boolean, jsonb, date, real } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Solar Reviews Schema - All tables will be in the public schema with solarreviews prefix
export const solarProviders = pgTable('solarreviews_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  businessName: varchar('business_name', { length: 255 }),
  location: varchar('location', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  
  // Business Details
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseState: varchar('license_state', { length: 50 }),
  licenseType: varchar('license_type', { length: 50 }), // C-46, C-10, etc.
  licenseFirstIssued: date('license_first_issued'),
  licenseLastRenewed: date('license_last_renewed'),
  yearsInBusiness: integer('years_in_business'),
  employeeCount: integer('employee_count'),
  serviceArea: text('service_area'),
  
  // Solar Specific Info
  specialties: jsonb('specialties').$type<string[]>().default([]),
  brandsWorkedWith: jsonb('brands_worked_with').$type<string[]>().default([]),
  averageCostPerWatt: decimal('average_cost_per_watt', { precision: 5, scale: 2 }),
  averageTurnaroundDays: integer('average_turnaround_days'),
  estimatedInstalledKw: decimal('estimated_installed_kw', { precision: 10, scale: 2 }),
  
  // Ratings & Stats
  overallRating: decimal('overall_rating', { precision: 3, scale: 2 }).default('0'),
  totalReviews: integer('total_reviews').default(0),
  totalLeads: integer('total_leads').default(0),
  reviewSummary: jsonb('review_summary').$type<{
    avgRating: number
    numReviews: number
    topReviews: Array<{rating: number, text: string, source: string}>
  }>().default({avgRating: 0, numReviews: 0, topReviews: []}),
  
  // Status & Verification
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  verificationDate: timestamp('verification_date'),
  
  // Enrichment & Crawling
  profiles: jsonb('profiles').$type<Record<string, any>>().default({}),
  lastCrawled: timestamp('last_crawled'),
  crawlSources: jsonb('crawl_sources').$type<Array<{source: string, url: string, timestamp: string}>>().default([]),
  normalizedName: varchar('normalized_name', { length: 255 }),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Embeddings table for semantic search
export const solarEmbeddings = pgTable('solarreviews_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').references(() => solarProviders.id).notNull(),
  embeddingVector: jsonb('embedding_vector').$type<number[]>().notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'profile', 'reviews', 'specialties'
  content: text('content').notNull(),
  model: varchar('model', { length: 100 }).default('text-embedding-3-large'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const solarReviews = pgTable('solarreviews_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').references(() => solarProviders.id).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(), // Clerk user ID
  
  // Review Content
  rating: integer('rating').notNull(), // 1-5 stars
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  
  // Project Details
  projectType: varchar('project_type', { length: 100 }), // residential, commercial, etc.
  systemSize: decimal('system_size', { precision: 6, scale: 2 }), // in kW
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  costPerWatt: decimal('cost_per_watt', { precision: 5, scale: 2 }),
  installationDate: timestamp('installation_date'),
  
  // Experience Ratings (1-5 each)
  communicationRating: integer('communication_rating'),
  timelinessRating: integer('timeliness_rating'),
  qualityRating: integer('quality_rating'),
  valueRating: integer('value_rating'),
  
  // Review Status
  isVerified: boolean('is_verified').default(false),
  isPublished: boolean('is_published').default(true),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const solarLeads = pgTable('solarreviews_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: uuid('provider_id').references(() => solarProviders.id).notNull(),
  userId: varchar('user_id', { length: 255 }), // Optional - can be anonymous
  
  // Contact Information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  
  // Project Information
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  
  projectType: varchar('project_type', { length: 100 }), // residential, commercial
  estimatedSystemSize: varchar('estimated_system_size', { length: 50 }),
  monthlyElectricBill: decimal('monthly_electric_bill', { precision: 8, scale: 2 }),
  timeframe: varchar('timeframe', { length: 100 }), // ASAP, 3-6 months, etc.
  
  // Additional Details
  message: text('message'),
  source: varchar('source', { length: 100 }).default('solarreviews'), // tracking source
  
  // Lead Status
  status: varchar('status', { length: 50 }).default('new'), // new, contacted, qualified, closed
  notes: text('notes'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const solarUsers = pgTable('solarreviews_users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  
  // Profile Information
  profileImage: varchar('profile_image', { length: 500 }),
  location: varchar('location', { length: 255 }),
  
  // User Type
  userType: varchar('user_type', { length: 50 }).default('consumer'), // consumer, provider, admin
  providerId: uuid('provider_id').references(() => solarProviders.id), // If user is a provider
  
  // Preferences
  notifications: boolean('notifications').default(true),
  emailUpdates: boolean('email_updates').default(true),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
