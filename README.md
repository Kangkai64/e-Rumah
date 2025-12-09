# e-Rumah — Reverse Annuity Scheme Management System

**A digital platform to manage Malaysia's Reverse Annuity Scheme for seniors (60+).**

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)

---

## Project Overview
**e-Rumah** helps elderly homeowners in Malaysia convert their home equity into monthly income, a lump sum, or a credit line while continuing to live in their homes.  

This system simplifies the process for elderly applicants and nominees, manages loan disbursement, monitors property compliance, and allows administrators to manage all applications digitally.

**Key Benefits:**
- Elderly-friendly interface with large buttons and audio instructions
- Nominee verification to prevent fraud
- Digital document management
- Compliance reminders for taxes, insurance, and maintenance
- Centralized dashboard for government/admin use

---

## Features

### For Elderly & Nominee
- Guided onboarding and application assistance
- Eligibility auto-check and document submission
- Health monitoring and reminders

### Financial & Payout Module
- Loan amount calculator based on property and age
- Payout options: monthly, lump sum, or credit line
- Payment tracking with notifications

### Admin Module
- Application review, approve/reject workflow
- Compliance and property monitoring
- Centralized reporting dashboard

### Customer Support
- Chatbot + human support
- Issue reporting

---

## Technology Stack
- **Frontend:** React.js + Vite
- **Backend:** PHP (planned)
- **Database:** Supabase (PostgreSQL, planned)
- **IDE:** Visual Studio Code
- **Version Control:** Git + GitHub

---

## Project Structure

### `src/` Folder Organization

```
src/
├── features/          - Feature modules (each feature in its own folder)
│   ├── auth/         - Login, register, logout
│   ├── application/  - Application forms for elderly
│   ├── payment/      - Payment tracking and disbursement
│   ├── admin/        - Admin dashboard
│   └── home/         - Homepage sections
│
├── layouts/          - Page layouts (Header, Footer)
│
├── shared/           - Reusable code across the app
│   ├── components/   - Reusable UI components (Button, Container)
│   ├── utils/        - Helper functions (formatCurrency, calculateAge)
│   └── hooks/        - Custom React hooks
│
├── assets/           - Images, icons, static files
├── App.jsx           - Main app component
├── main.jsx          - Entry point
└── index.css         - Global styles
```

### What Each Folder Does

**`features/`** - Each major feature gets its own folder. Inside each feature:
- `components/` - UI components specific to that feature
- `services/` - API calls and business logic
- `hooks/` - Custom hooks for that feature

**`layouts/`** - Components that appear on every page (Header, Footer)

**`shared/`** - Code that's used in multiple places
- Buttons, forms, containers
- Helper functions like formatting dates or currency
- Custom React hooks

This structure keeps code organized by feature, making it easy to find and update specific parts of the app.

---

## Getting Started

### Prerequisites
- Node.js ≥ 18.x
- npm (comes with Node.js)
- PHP ≥ 8.x
- Git

### Installation
1. **Clone the repository**
```bash
git clone https://github.com/Bompipi/e-Rumah.git
cd e-Rumah
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

---

## Color Scheme
Inspired by [Kalsis](https://kalsis.com.my/)

- **Primary Red:** `#A8202D` - Buttons, accents, hero/footer backgrounds
- **Black:** `#161519` - Text, borders
- **Grey:** `#777778` - Secondary text
- **Light Grey:** `#F5F5F5` - Backgrounds, subtle elements

npm install react-icons
