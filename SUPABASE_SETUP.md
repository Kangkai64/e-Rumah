# Supabase Database Integration - Setup Guide

## 🎯 What Was Implemented

### 1. **Database Schema** (PostgreSQL/Supabase)
- ✅ **users** table - Stores main and joint applicants
- ✅ **applications** table - Master record with status tracking
- ✅ **application_data** table - Stores form data as JSONB + current step
- ✅ **nominees** table - Beneficiary information
- ✅ **properties** table - Property details
- ✅ **transactions** table - Financial records
- ✅ **health_reports** table - Medical documents
- ✅ **customer_support_inquiries** table - Support tickets

### 2. **Backend Services**
- ✅ **authService.js** - Authentication (signup, login, logout, session management)
- ✅ **applicationService.js** - CRUD operations with localStorage fallback
- ✅ **supabase.js** - Supabase client (already existed in config/)

### 3. **Frontend Integration**
- ✅ **ApplicationController** - Now saves to Supabase with auto-save (debounced 1s)
- ✅ **AuthContext** - Global auth state management
- ✅ **LoginPage** - User authentication UI
- ✅ **SignupPage** - User registration UI
- ✅ **ProtectedRoute** - Route protection (currently disabled for testing)

### 4. **Features**
- ✅ Auto-save form data to Supabase (1 second debounce)
- ✅ Load saved application on login (restores currentStep + formData)
- ✅ localStorage fallback if Supabase fails
- ✅ Loading states and saving indicators
- ✅ Row Level Security (RLS) policies
- ✅ One active application per user constraint

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose a project name (e.g., "e-rumah")
4. Set a strong database password (SAVE THIS!)
5. Select region (closest to Malaysia)
6. Wait for project creation (~2 minutes)

### Step 2: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open the file `supabase/migrations/001_initial_schema.sql`
4. Copy the entire SQL script
5. Paste into Supabase SQL Editor
6. Click **"Run"** button
7. ✅ You should see "Success. No rows returned"

### Step 3: Get API Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 4: Configure Environment Variables

✅ **Already configured!** Your `.env` file already has:
```
VITE_SUPABASE_URL=https://ktwarkyeopizmmazizmw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

If you need to update them:
1. Open `.env` file in your project root
2. Update the values
3. Save the file
4. **IMPORTANT**: Restart your dev server after changing .env

### Step 5: Enable Email Authentication (Optional)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email templates if needed (Settings → Auth → Email Templates)

### Step 6: Test the Integration

1. Restart dev server:
   ```powershell
   npm run dev
   ```

2. Open http://localhost:5173

3. Test signup:
   - Go to http://localhost:5173/signup
   - Create an account
   - Check Supabase Dashboard → Authentication → Users (should see new user)

4. Test login:
   - Go to http://localhost:5173/login
   - Login with your credentials

5. Test application form:
   - Go to http://localhost:5173/application
   - Fill some fields
   - Wait 1 second (auto-save triggers)
   - Check browser console for "✅ Auto-saved to Supabase"
   - Check Supabase Dashboard → Table Editor → `application_data` (should see your data)

---

## 🔍 How It Works

### Data Flow

```
User fills form
    ↓
handleChange() updates formData state
    ↓
useEffect triggers after 1 second (debounced)
    ↓
debouncedSave() called
    ↓
Try to save to Supabase
    ↓
✅ Success: Save to localStorage as backup
❌ Fail: Save to localStorage as fallback
```

### Storage Structure

**In Supabase `application_data` table:**
```sql
id: uuid
application_id: uuid (foreign key)
current_step: integer (1-7)
form_data: jsonb {
  nameAsPerNRIC: "John Doe",
  nricNo: "850215-10-1234",
  address: "123 Jalan...",
  ... all 100+ fields
}
created_at: timestamp
updated_at: timestamp
```

**In localStorage (backup):**
```javascript
{
  userId: "user-uuid",
  formData: { ...all fields },
  currentStep: 3,
  savedAt: "2025-12-08T..."
}
```

### Authentication Flow

1. **Signup**: Creates auth user + users table record
2. **Login**: Validates credentials, creates session
3. **Session**: Stored in browser, auto-refreshed
4. **Protected Route**: Checks if user logged in (currently disabled for testing)

---

## 🧪 Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Environment variables configured
- [ ] Can create new account (signup)
- [ ] Can login with credentials
- [ ] Can access /application route
- [ ] Form data auto-saves (check console)
- [ ] Form data appears in Supabase table
- [ ] Refresh page restores form data and currentStep
- [ ] Works on different device (after login)
- [ ] localStorage fallback works (turn off internet)

---

## 🎛️ Configuration Options

### Enable Route Protection

In `src/components/ProtectedRoute.jsx`, uncomment line 23:
```javascript
return <Navigate to="/login" replace />
```

This will force users to login before accessing /application.

### Adjust Auto-Save Delay

In `src/controllers/ApplicationController.jsx`, line 284:
```javascript
saveTimeoutRef.current = setTimeout(() => {
  debouncedSave(formData, currentStep)
}, 1000)  // Change 1000 to desired milliseconds
```

### Disable localStorage Fallback

In `src/services/applicationService.js`, remove the fallback calls:
```javascript
// Comment out these lines:
saveToLocalStorage(currentUser.id, data, step)
```

---

## 📊 Database Structure

### Relationships

```
users (1) ─── (many) applications
applications (1) ─── (1) application_data
applications (1) ─── (many) nominees
applications (1) ─── (1) properties
users (1) ─── (many) transactions
users (1) ─── (many) health_reports
users (1) ─── (many) customer_support_inquiries
```

### Key Constraints

- User can only have **ONE** application with status `approved` or `underReviewed`
- Joint applicant created only when main applicant dies
- All tables have Row Level Security (RLS) enabled
- Users can only see their own data

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: 
1. Check `.env.local` file exists
2. Verify variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restart dev server: `npm run dev`

### Issue: "Error loading from Supabase"

**Solution**:
1. Check browser console for error details
2. Verify SQL migration ran successfully
3. Check Supabase Dashboard → Project Settings → API (credentials correct?)
4. Test connection: Open browser DevTools → Network tab → Look for supabase.co requests

### Issue: Form data not saving

**Solution**:
1. Check browser console for "✅ Auto-saved to Supabase"
2. Open Supabase Dashboard → Table Editor → `application_data`
3. Verify user is authenticated (check `currentUser` state)
4. Check localStorage: DevTools → Application → Local Storage

### Issue: "Policy violation" error

**Solution**:
1. Make sure user is logged in
2. Check RLS policies in Supabase Dashboard → Table Editor → application_data → Policies
3. Verify `auth.uid()` matches `user_id` in applications table

---

## 📝 Next Steps (Future Enhancements)

- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Create admin dashboard
- [ ] Add application submission workflow
- [ ] Extract nominees/property to separate tables on submit
- [ ] Add file upload for documents (Supabase Storage)
- [ ] Add real-time collaboration (if joint applicant)
- [ ] Add application status tracking
- [ ] Add notifications

---

## 🔐 Security Notes

- ✅ Environment variables excluded from Git (in .gitignore)
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Passwords hashed by Supabase Auth
- ✅ Anon key safe to use in frontend (RLS protects data)
- ⚠️ Never commit `.env.local` to Git
- ⚠️ Use separate Supabase projects for dev/production

---

## 📚 Additional Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Auth: https://supabase.com/docs/guides/auth
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL JSONB: https://www.postgresql.org/docs/current/datatype-json.html

---

**✅ Setup Complete!** Your application now has full database integration with authentication and auto-save functionality.
