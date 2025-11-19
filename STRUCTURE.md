# RASMS Project Structure

This project follows a **feature-based architecture** for better scalability and maintainability.

## 📁 Folder Structure

```
src/
├── features/              # Feature modules
│   ├── auth/             # Authentication feature
│   │   ├── components/   # Login, Register, etc.
│   │   ├── services/     # authService.js (API calls)
│   │   └── hooks/        # useAuth, etc.
│   ├── application/      # Application management
│   │   ├── components/   # ApplicationForm, etc.
│   │   ├── services/     # applicationService.js
│   │   └── hooks/        # useApplication, etc.
│   ├── payment/          # Payment & disbursement
│   │   ├── components/   # PaymentDashboard, etc.
│   │   ├── services/     # paymentService.js
│   │   └── hooks/        # usePayment, etc.
│   ├── admin/            # Admin panel
│   │   ├── components/   # AdminDashboard, etc.
│   │   ├── services/     # adminService.js
│   │   └── hooks/        # useAdmin, etc.
│   └── home/             # Homepage sections
│       └── components/   # Hero, Features, Eligibility, CTA
├── layouts/              # Layout components
│   ├── Header.jsx
│   └── Footer.jsx
├── shared/               # Shared/reusable code
│   ├── components/       # Button, Container, etc.
│   ├── utils/           # helpers.js, validators.js
│   └── hooks/           # useForm, useFetch, etc.
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## 🎯 Architecture Benefits

1. **Feature Isolation**: Each feature has its own components, services, and hooks
2. **Scalability**: Easy to add new features without affecting existing code
3. **Maintainability**: Clear organization makes debugging and updates easier
4. **Reusability**: Shared components and utilities reduce code duplication
5. **Team Collaboration**: Multiple developers can work on different features simultaneously

## 📝 Naming Conventions

- **Components**: PascalCase (e.g., `ApplicationForm.jsx`)
- **Services**: camelCase (e.g., `authService.js`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.js`)
- **Utils**: camelCase (e.g., `helpers.js`)

## 🚀 Next Steps

1. Install routing library: `npm install react-router-dom`
2. Set up state management (Context API or Redux)
3. Connect to backend API (Supabase)
4. Implement authentication flow
5. Build application forms
