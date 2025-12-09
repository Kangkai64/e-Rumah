# Creating Admin and Customer Support Accounts

Since admin and customer support accounts are pre-created (not through registration), you need to create them manually in Supabase.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Create Auth User
1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. **Click "Add user"** → **Create new user**
3. **Fill in the form**:
   - Email: `admin@erumah.com` (use a real email you can access)
   - Password: `Admin@123` (or your chosen password - **WRITE IT DOWN!**)
   - ✅ **IMPORTANT**: Check "Auto Confirm User" checkbox
   - ✅ **IMPORTANT**: Check "Send user a magic link" if you want them to set their own password
4. **Click "Create user"**
5. **Copy the User ID** (UUID) - you'll need this in Step 2

### Step 2: Add User to Database
1. **Go to Table Editor** → **users** table
2. **Click "Insert" button** → **Insert row**
3. **Fill in the values**:
   - `id`: Paste the UUID you copied from Step 1
   - `email`: Same as Step 1 (e.g., `admin@erumah.com`)
   - `role`: Type `admin` (or `support` for customer support)
   - `type`: Type `main`
   - `full_name`: Type a name (e.g., `System Administrator`)
   - Leave other fields blank (they'll auto-fill)
4. **Click "Save"**

### Step 3: Test Login
1. Go to `/staff-login` in your app
2. Enter the email and password from Step 1
3. Should redirect to admin/support dashboard

## Troubleshooting "Invalid login credentials"

If you get this error, try these fixes:

### Fix 1: Reset Password
1. Go to **Authentication** → **Users** in Supabase
2. Click on the user
3. Click **"Send recovery email"** or **"Reset password"**
4. Use the new password to login

### Fix 2: Check Email Confirmation
1. Go to **Authentication** → **Users**
2. Look for "Email Confirmed" column
3. If it says "No" or blank:
   - Click on the user
   - Click **"Confirm email"** button

### Fix 3: Recreate User with Correct Settings
1. Delete the existing user from **Authentication** → **Users**
2. Delete the row from **Table Editor** → **users**
3. Create again following Method 1, ensuring:
   - ✅ "Auto Confirm User" is checked
   - Password is at least 6 characters
   - Write down the EXACT password you used

### Fix 4: Check the Role in Database
1. Go to **Table Editor** → **users**
2. Find your admin user
3. Make sure `role` column says exactly `admin` (lowercase)
4. If it's wrong, click the row and edit it

## Method 2: Using SQL (Faster for multiple accounts)

Run this in **Supabase SQL Editor**:

```sql
-- Create Admin Account
-- First, get the user ID from Supabase Auth dashboard after creating the user
-- Or create both auth user and database user in one go:

-- For Admin
INSERT INTO users (id, email, role, type, full_name)
VALUES (
  'paste-auth-user-id-here',  -- Get this from Authentication > Users
  'admin@erumah.com',
  'admin',
  'main',
  'System Administrator'
);

-- For Customer Support
INSERT INTO users (id, email, role, type, full_name)
VALUES (
  'paste-auth-user-id-here',  -- Get this from Authentication > Users
  'support@erumah.com',
  'support',
  'main',
  'Customer Support'
);
```

## Method 3: Programmatic Creation (For bulk)

If you need to create many staff accounts, you can use this SQL:

```sql
-- Function to create staff account
CREATE OR REPLACE FUNCTION create_staff_account(
  staff_email TEXT,
  staff_password TEXT,
  staff_role TEXT,
  staff_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Note: You still need to create the auth user manually first
  -- This function only creates the database record
  
  -- Insert into users table
  INSERT INTO users (id, email, role, type, full_name)
  SELECT 
    id,
    staff_email,
    staff_role,
    'main',
    staff_name
  FROM auth.users
  WHERE email = staff_email
  RETURNING id INTO new_user_id;
  
  RETURN 'Staff account created: ' || staff_email;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- 1. First create auth user in Supabase Dashboard
-- 2. Then run:
-- SELECT create_staff_account('admin@erumah.com', 'password123', 'admin', 'John Doe');
```

## Important Notes

1. **Password Security**: 
   - Use strong passwords (min 8 characters, mix of letters, numbers, symbols)
   - Store passwords securely (e.g., password manager)
   - Change default passwords immediately

2. **Role Values**:
   - `user` - Regular customers (elders)
   - `admin` - Full system access
   - `support` - Customer support staff

3. **Email Verification**:
   - Make sure to check "Auto Confirm User" when creating in dashboard
   - Or manually confirm via Authentication → Users → Click user → Confirm email

4. **Testing**:
   - After creating, test login at `/staff-login`
   - Verify you're redirected to correct dashboard

## Example Staff Accounts for Testing

```
Admin Account:
- Email: admin@erumah.com
- Password: Admin@123
- Role: admin

Support Account:
- Email: support@erumah.com
- Password: Support@123
- Role: support
```

## Security Recommendations

1. **Production**:
   - Use company email addresses (@erumah.com)
   - Implement 2FA for admin accounts
   - Regularly audit staff access
   - Use strong password policies

2. **Development**:
   - Use test email addresses
   - Document test credentials securely
   - Never commit credentials to git
