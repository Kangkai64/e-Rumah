# 🚀 Quick Start Guide
claude --dangerously-skip-permissions
## ⚡ Setup in 5 Minutes

### 1. Create Supabase Project
```
1. Visit https://supabase.com
2. Click "New Project"
3. Wait 2 minutes
```

### 2. Run Database Migration
```
1. Supabase Dashboard → SQL Editor
2. Copy content from: supabase/migrations/001_initial_schema.sql
3. Paste and click "Run"
```

### 3. Get API Keys
```
1. Supabase Dashboard → Settings → API
2. Copy "Project URL" and "anon public key"
```

### 4. Configure .env.local
```env
✅ Already configured in .env file!
VITE_SUPABASE_URL=https://ktwarkyeopizmmazizmw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 5. Restart Server
```powershell
npm run dev
```

✅ **Done!** Auto-save now works with Supabase.

---

## 📂 Files Created

```
src/
├── config/
│   └── supabase.js                 # ✅ Already exists - Supabase connection
├── services/
│   ├── authService.js              # Login/signup functions
│   └── applicationService.js       # Save/load application
├── components/
│   ├── context/
│   │   └── AuthContext.jsx         # Global auth state
│   ├── auth/
│   │   ├── LoginPage.jsx           # Login UI
│   │   ├── SignupPage.jsx          # Signup UI
│   │   └── auth.css                # Auth styling
│   └── ProtectedRoute.jsx          # Route protection
└── controllers/
    └── ApplicationController.jsx    # ✅ UPDATED with Supabase

supabase/
└── migrations/
    └── 001_initial_schema.sql      # Database tables

.env                                 # ✅ Already configured with your credentials
```

---

## 🔑 Key Features

### Auto-Save
- Saves to Supabase every 1 second (debounced)
- Falls back to localStorage if offline
- Shows "💾 Saving..." indicator

### State Restoration
- Loads form data on mount
- Restores `currentStep` where user left off
- Works across devices (when logged in)

### Authentication
- Signup: `/signup`
- Login: `/login`
- Protected: `/application` (currently open for testing)

---

## 🧪 Quick Test

### Test Auto-Save
```
1. Go to http://localhost:5173/application
2. Fill any field (e.g., name)
3. Wait 1 second
4. Check console: "✅ Auto-saved to Supabase"
5. Check Supabase Dashboard → application_data table
```

### Test State Restoration
```
1. Fill form to Step 3
2. Close browser
3. Reopen http://localhost:5173/application
4. Should be on Step 3 with data intact
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Missing environment variables" | Restart server after editing `.env.local` |
| "Error loading from Supabase" | Check SQL migration ran successfully |
| Form not saving | Check browser console for errors |
| Can't login | Verify email/password in Supabase Dashboard → Auth |

---

## 🎛️ Toggle Route Protection

### Currently: OPEN (no login required)
**To enable login requirement:**

Edit `src/components/ProtectedRoute.jsx` line 23:
```javascript
// Uncomment this line:
return <Navigate to="/login" replace />

// And remove this line:
return children
```

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Main & joint applicants |
| `applications` | Master record with status |
| `application_data` | Form data (JSONB) + currentStep |
| `nominees` | Beneficiaries |
| `properties` | Property details |
| `transactions` | Financial records |
| `health_reports` | Medical docs |
| `customer_support_inquiries` | Support tickets |

---

## 🔐 Security

✅ Row Level Security (RLS) enabled  
✅ Users see only their own data  
✅ Passwords hashed automatically  
✅ `.env.local` excluded from Git  

⚠️ **Never commit** `.env.local` to GitHub!

---

## 📚 Full Documentation

See `SUPABASE_SETUP.md` for:
- Detailed setup instructions
- How it works (data flow)
- Testing checklist
- Troubleshooting guide
- Configuration options

---

**Need Help?** Check the Supabase Dashboard for:
- Table data: **Table Editor**
- SQL queries: **SQL Editor**
- Users: **Authentication → Users**
- Logs: **Project Settings → API → Logs**
