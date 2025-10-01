-- Create the solarreviews schema in the existing EnergyDaddy Supabase instance
CREATE SCHEMA IF NOT EXISTS solarreviews;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Solar Providers Table
CREATE TABLE solarreviews.solar_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(500),
    
    -- Business Details
    license_number VARCHAR(100),
    years_in_business INTEGER,
    employee_count INTEGER,
    service_area TEXT,
    
    -- Solar Specific Info
    specialties JSONB DEFAULT '[]'::jsonb,
    brands_worked_with JSONB DEFAULT '[]'::jsonb,
    average_cost_per_watt DECIMAL(5,2),
    average_turnaround_days INTEGER,
    
    -- Ratings & Stats
    overall_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_leads INTEGER DEFAULT 0,
    
    -- Status & Verification
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solar Reviews Table
CREATE TABLE solarreviews.solar_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES solarreviews.solar_providers(id) NOT NULL,
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Project Details
    project_type VARCHAR(100),
    system_size DECIMAL(6,2),
    total_cost DECIMAL(10,2),
    cost_per_watt DECIMAL(5,2),
    installation_date TIMESTAMP WITH TIME ZONE,
    
    -- Experience Ratings (1-5 each)
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    
    -- Review Status
    is_verified BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solar Leads Table
CREATE TABLE solarreviews.solar_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES solarreviews.solar_providers(id) NOT NULL,
    user_id VARCHAR(255), -- Optional - can be anonymous
    
    -- Contact Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Project Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    
    project_type VARCHAR(100),
    estimated_system_size VARCHAR(50),
    monthly_electric_bill DECIMAL(8,2),
    timeframe VARCHAR(100),
    
    -- Additional Details
    message TEXT,
    source VARCHAR(100) DEFAULT 'solarreviews',
    
    -- Lead Status
    status VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solar Users Table
CREATE TABLE solarreviews.solar_users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk user ID
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Profile Information
    profile_image VARCHAR(500),
    location VARCHAR(255),
    
    -- User Type
    user_type VARCHAR(50) DEFAULT 'consumer',
    provider_id UUID REFERENCES solarreviews.solar_providers(id),
    
    -- Preferences
    notifications BOOLEAN DEFAULT true,
    email_updates BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_solar_providers_location ON solarreviews.solar_providers(location);
CREATE INDEX idx_solar_providers_rating ON solarreviews.solar_providers(overall_rating DESC);
CREATE INDEX idx_solar_providers_active ON solarreviews.solar_providers(is_active);

CREATE INDEX idx_solar_reviews_provider ON solarreviews.solar_reviews(provider_id);
CREATE INDEX idx_solar_reviews_user ON solarreviews.solar_reviews(user_id);
CREATE INDEX idx_solar_reviews_rating ON solarreviews.solar_reviews(rating DESC);
CREATE INDEX idx_solar_reviews_published ON solarreviews.solar_reviews(is_published);

CREATE INDEX idx_solar_leads_provider ON solarreviews.solar_leads(provider_id);
CREATE INDEX idx_solar_leads_status ON solarreviews.solar_leads(status);
CREATE INDEX idx_solar_leads_created ON solarreviews.solar_leads(created_at DESC);

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION solarreviews.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_solar_providers_updated_at BEFORE UPDATE ON solarreviews.solar_providers FOR EACH ROW EXECUTE FUNCTION solarreviews.update_updated_at_column();
CREATE TRIGGER update_solar_reviews_updated_at BEFORE UPDATE ON solarreviews.solar_reviews FOR EACH ROW EXECUTE FUNCTION solarreviews.update_updated_at_column();
CREATE TRIGGER update_solar_leads_updated_at BEFORE UPDATE ON solarreviews.solar_leads FOR EACH ROW EXECUTE FUNCTION solarreviews.update_updated_at_column();
CREATE TRIGGER update_solar_users_updated_at BEFORE UPDATE ON solarreviews.solar_users FOR EACH ROW EXECUTE FUNCTION solarreviews.update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE solarreviews.solar_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE solarreviews.solar_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE solarreviews.solar_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE solarreviews.solar_users ENABLE ROW LEVEL SECURITY;

-- Public read access for providers (active ones)
CREATE POLICY "Public can view active providers" ON solarreviews.solar_providers
    FOR SELECT USING (is_active = true);

-- Public read access for published reviews
CREATE POLICY "Public can view published reviews" ON solarreviews.solar_reviews
    FOR SELECT USING (is_published = true);

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON solarreviews.solar_users
    FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON solarreviews.solar_users
    FOR UPDATE USING (auth.uid()::text = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON solarreviews.solar_users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Users can create reviews
CREATE POLICY "Authenticated users can create reviews" ON solarreviews.solar_reviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews" ON solarreviews.solar_reviews
    FOR SELECT USING (auth.uid()::text = user_id);

-- Users can create leads
CREATE POLICY "Anyone can create leads" ON solarreviews.solar_leads
    FOR INSERT WITH CHECK (true);

-- Providers can view their leads
CREATE POLICY "Providers can view their leads" ON solarreviews.solar_leads
    FOR SELECT USING (
        provider_id IN (
            SELECT id FROM solarreviews.solar_providers 
            WHERE id IN (
                SELECT provider_id FROM solarreviews.solar_users 
                WHERE id = auth.uid()::text
            )
        )
    );
