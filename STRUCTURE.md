# e-Rumah Project Structure

This project follows a **layered MVC (Model-View-Controller) architecture** for better scalability and maintainability.

## 📁 Folder Structure

```
src/
├── client_controller/        # Client-side view controllers and components
│   ├── admin/               # Admin-specific views and components
│   ├── application/         # Application form components
│   ├── auth/                # Authentication components (Login, Register)
│   ├── common/              # Reusable UI components
│   │   ├── Button.jsx      # Reusable button component
│   │   ├── Container.jsx   # Layout container component
│   │   └── PDFViewer.jsx   # PDF viewer component
│   ├── customerSupport/     # Customer support view components
│   │   └── CustomerSupport.css
│   ├── eligibility/         # Eligibility check components
│   ├── eventController/     # Event handling components
│   ├── health_report/       # Health reporting components
│   ├── landing/             # Landing page sections (Hero, Features, etc.)
│   ├── propertyCalculator/  # Property calculator components
│   ├── requestController/   # Request handling components
│   ├── sessionController/   # Session & authentication context
│   │   └── AuthContext.jsx # Authentication context provider
│   ├── user/                # User-specific components
│   └── userSupport/         # User support components
│
├── controllers/             # Application controllers (business logic)
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
├── data_access_controller/  # Database access layer
│   ├── connectionManager.js # Database connection management
│   ├── dataConverter.js     # Data transformation utilities
│   ├── modelController.js   # Model-specific database operations
│   ├── functions/           # Database functions and stored procedures
│   └── migrations/          # Database migration scripts
│
├── external_service_interface/ # External API integrations
│   ├── APIController.js     # External API handler
│   └── dataConverter.js     # External data transformation
│
├── models/                  # Data models and schemas
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
├── services/                # Business services
│   ├── applicationService.js  # Application-related operations
│   ├── authService.js         # Authentication services
│   ├── corsProxyService.js    # CORS proxy handling
│   ├── emailService.js        # Email notifications
│   ├── fileUploadService.js   # File upload handling
│   ├── reminderService.js     # Reminder notifications
│   └── settingsService.js     # Settings management
│
├── utils/                   # Helper utilities
│   ├── applicationValidation.js  # Application form validation
│   ├── enquiryFormValidation.js  # Enquiry form validation
│   ├── healthReportValidation.js # Health report validation
│   ├── icParser.js               # IC/NRIC parser
│   ├── pdfCompression.js         # PDF compression utilities
│   └── pdfConverter.js           # PDF conversion utilities
│
├── views/                   # View components (presentation layer)
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
├── layouts/                 # Page layouts
│   ├── Header.jsx          # Site header with navigation
│   ├── Header.css
│   ├── Footer.jsx          # Site footer
│   └── Footer.css
│
├── assets/                  # Static assets
│   ├── icons/              # Icon files organized by page
│   │   ├── about_us_page/
│   │   ├── health_report_page/
│   │   └── main_page/
│   ├── images/             # Image files
│   └── newdatabase_reference_for_chat/ # Database reference docs
│
├── config/                  # Configuration files
│   └── supabase.js         # Supabase client configuration
│
├── App.jsx                  # Main app component with routing
├── App.css                  # Main app styles
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

## 🎯 Architecture Benefits

1. **Separation of Concerns**: Clear separation between Views (UI), Controllers (logic), and Models (data)
2. **Scalability**: Easy to add new features without affecting existing code
3. **Maintainability**: Clear organization makes debugging and updates easier
4. **Reusability**: Common components and utilities reduce code duplication
5. **Testability**: Isolated layers make unit testing easier
6. **Team Collaboration**: Multiple developers can work on different layers simultaneously

## 📐 Architecture Layers

### 1. **Presentation Layer** (`views/`, `client_controller/`, `layouts/`)
- Pure presentation components
- Receives data via props
- Delegates actions to controllers
- No business logic

### 2. **Controller Layer** (`controllers/`)
- Business logic and state management
- Connects views with services and models
- Handles user interactions
- Manages application flow

### 3. **Service Layer** (`services/`)
- Reusable business logic
- API communication
- External integrations
- Authentication & authorization

### 4. **Data Access Layer** (`data_access_controller/`)
- Database operations
- Query builders
- Connection management
- Data transformations

### 5. **Model Layer** (`models/`)
- Data structures and schemas
- Validation rules
- Business entities
- Data relationships

### 6. **External Services** (`external_service_interface/`)
- Third-party API integrations
- External data sources
- Service adapters

### 7. **Utilities** (`utils/`)
- Helper functions
- Validators
- Formatters
- Parsers

## 📝 Naming Conventions

- **Components**: PascalCase (e.g., `ApplicationForm.jsx`)
- **Controllers**: PascalCase with `Controller` suffix (e.g., `AdminController.jsx`)
- **Services**: camelCase with `Service` suffix (e.g., `authService.js`)
- **Models**: PascalCase (e.g., `Application.js`)
- **Utils**: camelCase (e.g., `icParser.js`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.js`)

## 🔄 Data Flow

```
User Interaction
    ↓
View Component (views/)
    ↓
Controller (controllers/)
    ↓
Service (services/)
    ↓
Data Access Controller (data_access_controller/)
    ↓
Database (Supabase)
```

## 🚀 Key Features

- **Authentication**: AuthContext in `client_controller/sessionController/`
- **Reusable Components**: Button, Container, PDFViewer in `client_controller/common/`
- **Form Validation**: Multiple validators in `utils/`
- **File Handling**: Upload, compression, conversion services
- **Email Notifications**: Reminder and notification services
- **Admin Dashboard**: Complete admin management system
- **User Dashboard**: User application tracking and health reports
- **Customer Support**: Inquiry management system

## 🔧 Next Steps

1. Connect all controllers to backend services
2. Implement comprehensive error handling
3. Add loading states and skeleton screens
4. Implement data caching strategies
5. Add unit and integration tests
6. Set up CI/CD pipeline
