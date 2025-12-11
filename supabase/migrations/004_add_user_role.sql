-- Add role column to users table for different user types

ALTER TABLE users 
ADD COLUMN role TEXT NOT NULL DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'support'));

-- Add index for faster role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Update existing users to have 'user' role (if any exist)
UPDATE users SET role = 'user' WHERE role IS NULL;
