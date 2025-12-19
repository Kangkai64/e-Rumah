-- Sample data for new tables: caregivers, healthcare_providers, and family_members
-- This migration creates test data to work with the updated sharing functionality

-- First, let's create some sample users if they don't exist (these will be referenced by the new tables)
-- Note: In a real environment, these users would already exist from user registration

INSERT INTO auth.users (id, aud, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'dr.smith@hospital.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', ''),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'nurse.johnson@clinic.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', ''),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'caregiver.brown@care.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', ''),
  ('44444444-4444-4444-4444-444444444444', 'authenticated', 'family.member@email.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', ''),
  ('55555555-5555-5555-5555-555555555555', 'authenticated', 'john.patient@email.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Create corresponding users in the public.users table
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'dr.smith@hospital.com', 'Dr. Sarah Smith', 'user', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'nurse.johnson@clinic.com', 'Nurse Emily Johnson', 'user', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'caregiver.brown@care.com', 'Caregiver Michael Brown', 'user', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'family.member@email.com', 'Mary Patient Sister', 'user', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'john.patient@email.com', 'John Patient', 'user', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Sample Healthcare Providers
INSERT INTO public.healthcare_providers (user_id, provider_type, license_number, specialty, organization_name, address, is_verified)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'doctor', 'MD123456', 'Cardiology', 'City General Hospital', '123 Hospital St, Medical District', true),
  ('22222222-2222-2222-2222-222222222222', 'nurse', 'RN789012', 'Emergency Care', 'Community Health Clinic', '456 Health Ave, Downtown', true);

-- Sample Caregivers
INSERT INTO public.caregivers (user_id, license_number, specialization, years_of_experience, bio, is_verified)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'CG456789', 'Elderly Care', 8, 'Experienced caregiver specializing in elderly patient care with focus on chronic disease management.', true);

-- Sample Family Members (assuming john.patient@email.com is the main user)
INSERT INTO public.family_members (user_id, family_member_user_id, relationship_type, is_emergency_contact, is_verified, permissions_level, notes)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'sibling', true, true, 'view_and_share', 'Sister who helps manage medical appointments');

-- Sample Health Reports for testing sharing functionality
INSERT INTO public.health_reports (id, user_id, report_type, report_date, report_title, provider_name, notes, health_report_status, due_status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Blood Test', '2024-12-15', 'Annual Blood Panel', 'Dr. Sarah Smith', 'Regular checkup blood work', 'Approved', 'Up to Date'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'Heart Monitoring', '2024-12-10', 'ECG Results', 'Dr. Sarah Smith', 'Follow-up heart monitoring', 'Approved', 'Up to Date');

-- Sample Health Report Shares to demonstrate the new functionality
INSERT INTO public.health_report_shares (report_id, shared_by_user_id, shared_with_type, shared_with_id, shared_with_email, expires_at)
VALUES 
  -- Share blood test with family member
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'family', '44444444-4444-4444-4444-444444444444', 'family.member@email.com', (now() + interval '30 days')),
  
  -- Share heart monitoring with doctor
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'healthcare_provider', '11111111-1111-1111-1111-111111111111', 'dr.smith@hospital.com', (now() + interval '60 days')),
  
  -- Share blood test with caregiver
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'caregiver', '33333333-3333-3333-3333-333333333333', 'caregiver.brown@care.com', (now() + interval '14 days'));

-- Create additional sample data for comprehensive testing

-- Additional Healthcare Providers
INSERT INTO public.healthcare_providers (user_id, provider_type, license_number, specialty, organization_name, address, is_verified)
VALUES 
  ('66666666-6666-6666-6666-666666666666', 'therapist', 'PT112233', 'Physical Therapy', 'Rehabilitation Center', '789 Recovery Rd, Suburbs', true),
  ('77777777-7777-7777-7777-777777777777', 'clinic', 'CL445566', 'General Practice', 'Family Health Clinic', '321 Family St, Neighborhoods', false);

-- Additional Users for the new healthcare providers
INSERT INTO auth.users (id, aud, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
VALUES 
  ('66666666-6666-6666-6666-666666666666', 'authenticated', 'therapist.wilson@rehab.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', ''),
  ('77777777-7777-7777-7777-777777777777', 'authenticated', 'clinic.admin@family.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES 
  ('66666666-6666-6666-6666-666666666666', 'therapist.wilson@rehab.com', 'Physical Therapist Wilson', 'user', now(), now()),
  ('77777777-7777-7777-7777-777777777777', 'clinic.admin@family.com', 'Family Clinic Admin', 'user', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Additional Caregivers
INSERT INTO public.caregivers (user_id, license_number, specialization, years_of_experience, bio, is_verified)
VALUES 
  ('88888888-8888-8888-8888-888888888888', 'CG778899', 'Pediatric Care', 5, 'Specialized in caring for children with chronic conditions.', true),
  ('99999999-9999-9999-9999-999999999999', 'CG001122', 'Home Care', 12, 'Experienced home care specialist for post-surgery recovery.', false);

-- Additional Users for caregivers
INSERT INTO auth.users (id, aud, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
VALUES 
  ('88888888-8888-8888-8888-888888888888', 'authenticated', 'pediatric.caregiver@kids.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', ''),
  ('99999999-9999-9999-9999-999999999999', 'authenticated', 'home.caregiver@care.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES 
  ('88888888-8888-8888-8888-888888888888', 'pediatric.caregiver@kids.com', 'Pediatric Caregiver Lisa', 'user', now(), now()),
  ('99999999-9999-9999-9999-999999999999', 'home.caregiver@care.com', 'Home Care Specialist Tom', 'user', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Additional Family Members for more complex relationships
INSERT INTO public.family_members (user_id, family_member_user_id, relationship_type, is_emergency_contact, is_verified, permissions_level, notes)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '10101010-1010-1010-1010-101010101010', 'spouse', true, true, 'full', 'Primary emergency contact and healthcare proxy'),
  ('55555555-5555-5555-5555-555555555555', '20202020-2020-2020-2020-202020202020', 'child', false, true, 'view', 'Adult child living nearby');

-- Additional Users for family members
INSERT INTO auth.users (id, aud, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
VALUES 
  ('10101010-1010-1010-1010-101010101010', 'authenticated', 'spouse@email.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', ''),
  ('20202020-2020-2020-2020-202020202020', 'authenticated', 'adult.child@email.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES 
  ('10101010-1010-1010-1010-101010101010', 'spouse@email.com', 'Jane Patient Spouse', 'user', now(), now()),
  ('20202020-2020-2020-2020-202020202020', 'adult.child@email.com', 'Alex Patient Child', 'user', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Comments for reference
COMMENT ON TABLE public.healthcare_providers IS 'Healthcare providers who can receive shared health reports';
COMMENT ON TABLE public.caregivers IS 'Certified caregivers who can access patient health reports';
COMMENT ON TABLE public.family_members IS 'Family relationships with permission levels for health report sharing';
COMMENT ON TABLE public.health_report_shares IS 'Records of shared health reports with expiration and access tracking';