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
├── client_controller/     - Client-side view controllers and components
│   ├── admin/            - Admin-specific views and components
│   ├── application/      - Application form components
│   ├── auth/             - Authentication components
│   ├── common/           - Reusable UI components (Button, Container, PDFViewer)
│   ├── customerSupport/  - Customer support view components
│   ├── eligibility/      - Eligibility check components
│   ├── eventController/  - Event handling components
│   ├── health_report/    - Health reporting components
│   ├── landing/          - Landing page sections
│   ├── propertyCalculator/ - Property calculator components
│   ├── requestController/ - Request handling components
│   ├── sessionController/ - Session & auth context (AuthContext)
│   ├── user/             - User-specific components
│   └── userSupport/      - User support components
│
├── controllers/          - Application controllers (business logic)
│   ├── AdminController.jsx
│   ├── AdminReportController.jsx
│   ├── ApplicationController.jsx
│   ├── CustomerSupportController.jsx
│   ├── HealthReportController.jsx
│   ├── MaintainApplicationController.jsx
│   ├── PropertyCalculatorController.jsx
│   ├── UserDashboardController.jsx
│   └── UserSupportController.jsx
│
├── data_access_controller/ - Database access layer
│   ├── connectionManager.js
│   ├── dataConverter.js
│   ├── modelController.js
│   ├── functions/        - Database functions
│   └── migrations/       - Database migrations
│
├── external_service_interface/ - External API integrations
│   ├── APIController.js
│   └── dataConverter.js
│
├── models/               - Data models
│   ├── Admin.js
│   ├── Application.js
│   ├── CustomerSupportContact.js
│   ├── EligibityRule.js
│   ├── HealthReport.js
│   ├── Inquiry.js
│   ├── Loan.js
│   ├── LoanDisbursement.js
│   ├── Nominee.js
│   ├── Notification.js
│   ├── Property.js
│   ├── SupportConversation.js
│   ├── User.js
│   └── UserSupport.js
│
├── services/             - Business services
│   ├── applicationService.js
│   ├── authService.js
│   ├── corsProxyService.js
│   ├── emailService.js
│   ├── fileUploadService.js
│   ├── reminderService.js
│   └── settingsService.js
│
├── utils/                - Helper utilities
│   ├── applicationValidation.js
│   ├── enquiryFormValidation.js
│   ├── healthReportValidation.js
│   ├── icParser.js
│   ├── pdfCompression.js
│   └── pdfConverter.js
│
├── views/                - View components (presentation layer)
│   ├── AdminApplicationReviewView.jsx
│   ├── AdminReportView.jsx
│   ├── AdminView.jsx
│   ├── AnswerInquiryView.jsx
│   ├── ApplicationFormView.jsx
│   ├── CustomerSupportView.jsx
│   ├── HealthMonitoringView.jsx
│   ├── LoanStatementView.jsx
│   ├── MaintainApplicationView.jsx
│   ├── PropertyCalculatorView.jsx
│   └── UserSupportView.jsx
│
├── layouts/              - Page layouts (Header, Footer)
│   ├── Header.jsx
│   ├── Header.css
│   ├── Footer.jsx
│   └── Footer.css
│
├── assets/               - Static assets
│   ├── icons/           - Icon files
│   ├── images/          - Image files
│   └── newdatabase_reference_for_chat/ - Database references
│
├── config/               - Configuration files
│   └── supabase.js      - Supabase configuration
│
├── App.jsx               - Main app component
├── App.css               - Main app styles
├── main.jsx              - Entry point
└── index.css             - Global styles
```

### Architecture Overview

The project follows a **layered MVC architecture**:

- **Views** (`views/`) - Pure presentation components
- **Controllers** (`controllers/`) - Business logic and state management
- **Client Controllers** (`client_controller/`) - Client-side UI components and view controllers
- **Models** (`models/`) - Data models and schemas
- **Services** (`services/`) - Reusable business services
- **Data Access** (`data_access_controller/`) - Database operations
- **External Services** (`external_service_interface/`) - API integrations
- **Utils** (`utils/`) - Helper functions and validators

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
