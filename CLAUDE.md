# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # Production build
npm run lint      # ESLint
```

No test framework is configured.

Required environment variables in `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

This is a React 19 + Vite SPA backed entirely by Supabase (auth, database, storage). No backend server — all data access goes directly to Supabase from the browser.

### Directory layout

| Path                                    | Purpose                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `src/controllers/`                      | Smart components — own all state and business logic, render a paired View    |
| `src/views/`                            | Presentational components — receive props only, no direct Supabase calls     |
| `src/models/`                           | Data access objects — each model class wraps Supabase queries for one entity |
| `src/services/`                         | Stateless service functions (auth, file upload, email, application CRUD)     |
| `src/client_controller/`               | Shared UI, landing pages, auth pages, session management                     |
| `src/config/supabase.js`               | Single Supabase client instance used everywhere                              |
| `src/data_access_controller/migrations/` | SQL migration files (table schema definitions)                             |
| `src/data_access_controller/functions/` | Source of Supabase edge functions (deployed separately)                     |

> `src/data_access_controller/` and `src/external_service_interface/` are otherwise empty stubs.

### Controller ↔ View contract

Each controller imports exactly one View and passes everything down as props. **Controllers must not import from other controllers** (enforced by convention). Views are pure UI with no business logic.

### Controllers

| Controller                    | Route(s)                                          | Role        |
| ----------------------------- | ------------------------------------------------- | ----------- |
| `ApplicationController`       | `/application`, `/application/edit-nominees/:id`  | user        |
| `MaintainApplicationController` | `/user/application`, `/maintainApplication/:id` | user        |
| `UserDashboardController`     | `/user/dashboard`                                 | user        |
| `UserSupportController`       | `/user/support`                                   | user        |
| `HealthReportController`      | `/user/health-reports`, `/admin/health-reports`, `/maintainApplication/:id/health-reports` | user/admin |
| `PropertyCalculatorController`| `/property-calculator`                            | public      |
| `AdminController`             | `/admin/dashboard`                                | admin       |
| `AdminReportController`       | `/admin/report/:id` (view), `/admin/review/:id` (review) | admin  |
| `LoanDisbursementController`  | `/admin/disbursements`                            | admin       |
| `CustomerSupportController`   | `/support/dashboard`                              | support     |

`SharedReportPage` is an inline component in `App.jsx` at `/shared-report/:token` — public, no auth required.

### Authentication & roles

`AuthContext` (`src/client_controller/sessionController/AuthContext.jsx`) is the single source of truth for auth state. It exposes `{ user, userRole, applicationStatus, loading }`.

Three roles: `user`, `admin`, `support`.

- Staff roles (`admin`/`support`) are resolved from Supabase auth metadata first, then from the `admins` / `customer_supports` DB tables as fallback.
- `userRole` and `applicationStatus` are cached in `localStorage` to survive page reloads and to return a value on `TOKEN_REFRESHED` events (which intentionally skip DB refetch).

`ProtectedRoute` (`src/client_controller/ProtectedRoute.jsx`) enforces both role-based access and application-status-based routing:

- `user` with `applicationStatus === "incomplete"` → redirected to `/application`
- `user` with `applicationStatus === "terminated"` → blocked from `/application`
- Role mismatch → redirected to the appropriate dashboard for that role

### Application lifecycle

Users submit a 7-step wizard (`ApplicationController`). Form state auto-saves to Supabase with a 1-second debounce (localStorage as fallback). On submit, the controller:

1. Calls `submitApplicationComplete` to write nominees and property records.
2. Generates a PDF by filling the template at `public/Application_Form.pdf` using `pdf-lib`.
3. Uploads the PDF blob to the `application-forms` Supabase Storage bucket.

Application statuses: `draft` → `submitted` → `underReviewed` → `approved` | `terminated`.
If applied for termination: `approved` → `underReviewed` → `terminated`

### Customer support system

Two-sided chat system: staff (`CustomerSupportController` / `CustomerSupportView`) and users (`UserSupportController` / `UserSupportView`).

- Inquiries are stored in `customer_support_inquiries`; messages in `support_conversations`.
- `support_conversations` uses `entity_type` (`inquiry` | `nominee` | `health_report`) + `entity_id` to link messages to their inquiry.
- Both sides subscribe to real-time Supabase channels: conversation inserts and inquiry status updates.
- Inquiry statuses: `open` → `in_progress` → `resolved`. Once resolved, users cannot send further messages (blocked in controller and hidden in view).
- Staff can also manage flagged health reports and nominee issues from the same dashboard.
- Company contact info (email/phone) is stored in `localStorage` via `settingsService` and shown to users on the support page.

### Health monitoring

`HealthReportController` / `HealthMonitoringView` allows users to upload, view, and share health reports. Admins can view flagged reports. Reports can be shared via a token-based public link (`/shared-report/:token`) that expires and tracks access count.

### Loan disbursement

`LoanDisbursementController` / `LoanDisbursementView` (admin) manages payout records.
`UserDashboardController` / `LoanStatementView` (user) displays the disbursement schedule and property value.

- `LoanDisbursement` model handles bank details and disbursement records.
- Property value estimation is handled by a pipeline called from `User.reestimatePropertyValue()`, which calls a Supabase edge function.

### Key Supabase tables

| Table                           | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `applications`                  | Application records                              |
| `application_data`              | Form JSON + current wizard step                  |
| `users`                         | User profiles                                    |
| `admins`                        | Admin staff records                              |
| `customer_supports`             | Support staff records                            |
| `health_reports`                | Health report uploads                            |
| `health_report_shares`          | Share tokens for public report links             |
| `customer_support_inquiries`    | Support inquiries from users                     |
| `support_conversations`         | Messages within inquiries (entity_type + entity_id) |
| `loan_disbursements`            | Disbursement payout records                      |

### Models

`Application`, `Admin`, `User`, `Nominee`, `Property`, `Loan`, `LoanDisbursement`, `HealthReport`, `Inquiry`, `SupportConversation`, `UserSupport`, `CustomerSupportContact`, `EligibityRule`, `Notification`.

### Services

| File                    | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `authService.js`        | Supabase auth wrappers (sign in/out/up)        |
| `applicationService.js` | Application CRUD and submit helpers            |
| `fileUploadService.js`  | Storage uploads                                |
| `emailService.js`       | Email notifications                            |
| `settingsService.js`    | Company contact info via localStorage          |
| `corsProxyService.js`   | CORS proxy for external API calls              |

### PDF generation

`generatePDF()` in `ApplicationController` loads `/Application_Form.pdf`, uses `pdf-lib` to fill named form fields and radio groups, and embeds base64 PNG signature images at hardcoded page indices (applicant/joint: page 4; nominee acknowledgement: page 6).

### Validation

Always use custom React validation. Never use HTML `required`/`pattern` attributes or browser-native validation popups. Add `noValidate` to forms.
