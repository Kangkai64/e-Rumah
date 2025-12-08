-- e-Rumah Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- NULL for joint applicants until main dies
  type TEXT NOT NULL CHECK (type IN ('main', 'joint')),
  full_name TEXT,
  ic_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(type);

-- =============================================
-- APPLICATIONS TABLE (Master/Composite)
-- =============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joint_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Created when main dies
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'underReviewed', 'approved', 'rejected', 'terminated')),
  remarks TEXT, -- For rejection/termination messages
  main_applicant_deceased BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Constraint: User can only have ONE active application (approved or underReviewed)
CREATE UNIQUE INDEX idx_one_active_application 
  ON applications(user_id) 
  WHERE status IN ('approved', 'underReviewed');

-- =============================================
-- APPLICATION_DATA TABLE (Form State)
-- =============================================
CREATE TABLE application_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),
  form_data JSONB NOT NULL DEFAULT '{}', -- Stores all ~100+ form fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_application_data_application_id ON application_data(application_id);

-- GIN index for JSONB queries (optional, for querying inside JSON)
CREATE INDEX idx_application_data_form_data ON application_data USING GIN (form_data);

-- =============================================
-- NOMINEES TABLE
-- =============================================
CREATE TABLE nominees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('nominee1', 'nominee2')),
  salutation TEXT,
  name TEXT NOT NULL,
  ic_number TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  email TEXT,
  residence_phone TEXT,
  telephone TEXT,
  dob_day TEXT,
  dob_month TEXT,
  dob_year TEXT,
  sex TEXT,
  race TEXT,
  is_malaysian BOOLEAN DEFAULT FALSE,
  marital_status TEXT,
  relationship TEXT,
  occupation TEXT,
  employer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_nominees_application_id ON nominees(application_id);

-- =============================================
-- PROPERTIES TABLE
-- =============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  property_type TEXT,
  address TEXT NOT NULL,
  postcode TEXT,
  indicative_market_value NUMERIC(15, 2),
  valuation_date DATE,
  expected_market_value NUMERIC(15, 2),
  purchase_price NUMERIC(15, 2),
  purchase_date DATE,
  tenure_title TEXT,
  expiry_date DATE,
  build_up_area NUMERIC(10, 2),
  land_area NUMERIC(10, 2),
  is_encumbered BOOLEAN,
  bank_name TEXT,
  est_outstanding_balance NUMERIC(15, 2),
  has_fire_insurance BOOLEAN,
  insurance_company TEXT,
  insurance_period_validity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_properties_application_id ON properties(application_id);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payout', 'refund', 'fee', 'other')),
  amount NUMERIC(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  reference_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_application_id ON transactions(application_id);

-- =============================================
-- HEALTH_REPORTS TABLE
-- =============================================
CREATE TABLE health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  report_date DATE NOT NULL,
  report_type TEXT,
  report_file_url TEXT, -- File path/URL in Supabase Storage
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX idx_health_reports_application_id ON health_reports(application_id);

-- =============================================
-- CUSTOMER_SUPPORT_INQUIRIES TABLE
-- =============================================
CREATE TABLE customer_support_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID, -- Admin user ID (can add admin users table later)
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customer_support_user_id ON customer_support_inquiries(user_id);
CREATE INDEX idx_customer_support_status ON customer_support_inquiries(status);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_data_updated_at BEFORE UPDATE ON application_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nominees_updated_at BEFORE UPDATE ON nominees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_reports_updated_at BEFORE UPDATE ON health_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_support_updated_at BEFORE UPDATE ON customer_support_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_support_inquiries ENABLE ROW LEVEL SECURITY;

-- Users: Can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Applications: Users can see their own applications
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = joint_user_id);

CREATE POLICY "Users can create own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = joint_user_id);

-- Application Data: Users can access their application data
CREATE POLICY "Users can view own application data" ON application_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_data.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create own application data" ON application_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_data.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own application data" ON application_data
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = application_data.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Nominees: Users can see nominees for their applications
CREATE POLICY "Users can view nominees for own applications" ON nominees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = nominees.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Properties: Users can see properties for their applications
CREATE POLICY "Users can view properties for own applications" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = properties.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Transactions: Users can see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Health Reports: Users can see their own health reports
CREATE POLICY "Users can view own health reports" ON health_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Customer Support: Users can see their own inquiries
CREATE POLICY "Users can view own inquiries" ON customer_support_inquiries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own inquiries" ON customer_support_inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inquiries" ON customer_support_inquiries
  FOR UPDATE USING (auth.uid() = user_id);
