# Health Report & Support Module Test Data

Ready-to-type values for exercising `HealthReportController` / `HealthMonitoringView` (user + admin
sides) and `UserSupportController` / `CustomerSupportController` (chat-based support). All values are
constructed to pass the validation in `HealthReportController.jsx` (`handleMultipleFileUpload`,
`handleSubmitReminder`) and `HealthReport.js` as of 2026-07-08 — see "How these were derived" at the
bottom.

These reuse the two applicant personas from `WIZARD_TEST_DATA.md` so the same account can be used to
test the application wizard, health reports, and support tickets end-to-end:

- **Persona A** — Ahmad Bin Ismail, NRIC `650515-14-5677` (born 15/05/1965)
- **Persona B** — Salmah Binti Yusof, NRIC `681203-08-5432` (born 03/12/1968)

Any uploaded file just needs to be a real PDF/JPG/PNG/WEBP under the size limit — content isn't
inspected — so the sample files already in `test data/` (payslips, bank statements, MYKAD scans, etc.)
can be reused here as stand-ins for medical documents.

---

## 1. Health Report Upload (multi-file upload modal)

| Field                  | Entry 1                       | Entry 2                    | Entry 3                                  | Entry 4                             |
| ---------------------- | ------------------------------ | --------------------------- | ------------------------------------------ | ------------------------------------- |
| Report Type            | `Medical Report`               | `Lab Test`                  | `Prescription`                             | `Doctor's Visit Summary`              |
| Report Date            | `2026-06-01`                   | `2026-05-15`                | `2026-06-20`                               | `2026-07-01`                          |
| Report Title           | `Annual Health Checkup`        | `Blood Test Results`        | `Hypertension Medication`                  | `Cardiology Follow-up`                |
| Healthcare Provider    | `Hospital Kuala Lumpur`        | `Gleneagles KL`             | `Klinik Kesihatan Taman Melati`             | `Pantai Hospital Kuala Lumpur`         |
| File                   | `incomeStatement1.png` (dummy) | `incomeStatement2.png`      | `payslip1.jpg`                             | `payslip2.jpg`                        |

A 5th entry to exercise the "Others" custom-type field:

| Field               | Value                          |
| ------------------- | ------------------------------- |
| Report Type         | `Others`                       |
| Custom Report Type  | `Physiotherapy Session Notes`   |
| Report Date         | `2026-06-10`                   |
| Report Title        | `Knee Physiotherapy Session 3`  |
| Healthcare Provider | `Sunway Medical Centre`        |
| File                | `payslip3.png`                 |

Report Date must be on/after the applicant's derived birth date (`650515` → `1965-05-15` for Persona A,
`681203` → `1968-12-03` for Persona B) and is otherwise unrestricted, so any date from that birth date up
to today (`2026-07-08`) works.

## 2. Reminders

| Field                | Reminder 1                       | Reminder 2                  |
| -------------------- | ---------------------------------- | ----------------------------- |
| Title                | `Follow-up Blood Pressure Check`   | `Refill Diabetes Medication`  |
| Type                 | `Doctor visit`                     | `Medication refill`           |
| Date                 | `2026-07-20`                      | `2026-07-15`                  |
| Time                 | `10:00`                            | `09:00`                       |
| Category             | `Health & appointments`            | `Medication`                  |
| Notes                | `Bring previous blood pressure log`| `Check with pharmacy for stock`|
| Frequencies enabled  | 1 week, 3 days, 1 day (all)        | 3 days, 1 day                 |

Reminder date+time must be strictly in the future (relative to now) and no more than 5 years out — both
sample dates satisfy this as of 2026-07-08.

## 3. Sharing a Health Report

Only `link` and `email` share options work without extra setup (`caregiver`/`family`/`healthcare` require
a pre-existing verified row in `caregivers`/`family_members`/`healthcare_providers` linked to a real user
account, which is out of scope for basic UI testing):

| Field       | Value (link option) | Value (email option)        |
| ----------- | -------------------- | ----------------------------- |
| Share Option| `link`               | `email`                       |
| Expiry Days | `7`                  | `30`                          |
| Email       | —                    | `caretaker.family@example.com`|

The generated link resolves to `/shared-report/:token` — public route, no login required — and should
show the report until `expiryDays` elapse or it's revoked.

## 4. Admin Actions (Health Reports)

| Action  | Input                                                                 |
| ------- | ---------------------------------------------------------------------- |
| Approve | No input — click Approve, confirm.                                     |
| Flag    | Flag Reason: `Report appears incomplete — missing doctor's signature.` |
| Archive | No input — click Archive, confirm.                                     |
| Reupload| Select any small PDF/JPG/PNG/WEBP file to replace the existing one; status resets to `Pending`. |

---

## 5. Support Module — Creating an Inquiry

| Field   | Inquiry 1                                                                    | Inquiry 2                                                                          | Inquiry 3                                                          |
| ------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Subject | `inquiries` (General Inquiries)                                                | `health_report` (Health Report)                                                      | `nominee` (Nominee)                                                    |
| Message | `I haven't received an update on my loan disbursement schedule. Can someone check?` | `My latest health report was flagged — can you tell me what's missing so I can reupload?` | `I need to update my nominee's contact address, how do I do that?` |

Subject must be exactly one of `inquiries` / `health_report` / `nominee` (hardcoded `<option>` values in
`UserSupportView.jsx`); message is free text with no length limit enforced in `UserSupport.createInquiry`.

## 6. Support Module — Sending Messages

| Scenario                  | Message                                                        | File            |
| -------------------------- | ---------------------------------------------------------------- | ---------------- |
| Text-only reply            | `Thanks, I'll wait for the update.`                              | none             |
| Reply with attachment      | `Here's a screenshot of the error I'm seeing.`                   | any small image  |
| File-only (no text)        | *(leave message blank)*                                          | any small file — controller substitutes `(File attachment)` as the message text |

Sending is blocked entirely once `selectedInquiry.status === 'resolved'` (checked in
`UserSupportController.handleSendMessage`), and the input area is hidden/disabled in the view too.

## 7. Customer Support (staff) side

| Action           | Input                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| Reply to inquiry | `Thanks for reaching out — we've forwarded this to the relevant team.`       |
| Change status    | `open` → `in_progress` → `resolved` (staff-only transition)                  |
| View flagged health reports / nominee issues | Use the entries created in sections 1 and 4 above |

---

## Negative-path values (for validation testing)

| Scenario                                | Value to try                                        | Expected result                                                                 |
| ---------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Report date before birth date            | Report Date `1960-01-01` (Persona A, born 1965)         | "Report date cannot be earlier than your birth date"                              |
| Missing report type                      | Leave Report Type unselected                            | "Please select a report type"                                                     |
| "Others" with no custom type             | Report Type `Others`, Custom Report Type blank           | "Please specify custom report type"                                               |
| Oversized/wrong-type file (single upload)| A file > 10MB, or a `.docx`                              | "File size exceeds 10MB limit" / "Invalid file type. Only PDF, JPG, PNG, and WEBP files are allowed" |
| Flag report with no reason               | Leave Flag Reason blank, submit                          | "Flag reason is required"                                                          |
| Reminder date in the past                | Reminder Date `2026-01-01`, any past time                | "Reminder date and time cannot be in the past"                                    |
| Reminder date too far in the future      | Reminder Date `2032-01-01`                                | "Reminder date is too far in the future"                                          |
| Reminder enabled with no frequency        | `is_enabled=true`, uncheck all of 1 week/3 days/1 day     | "Please enable at least one reminder frequency"                                   |
| Message sent to a resolved inquiry       | Select a `resolved` inquiry, try to send a message        | "This inquiry has been resolved" (blocked before any request is made)             |
| Empty message + no file                  | Leave message blank, no file attached, click Send          | "Message or file required"                                                        |
| Share with unregistered caregiver email  | Share Option `caregiver`, Email of a user not in `caregivers` table | "User found but they are not registered as a caregiver" (or "No user found...") |

---

## How these were derived

- **Report type / category / reminder type enums** are copied verbatim from the `<option value="...">`
  attributes in `HealthMonitoringView.jsx` and the `REMINDER_TYPES`/`REMINDER_CATEGORIES` arrays in
  `HealthReport.js`, so the UI renders them as selected once entered.
- **Birth-date guard**: `HealthReportController.handleMultipleFileUpload` derives the applicant's birth
  date via `deriveUserBirthDate` (parses `YYMMDD` from the IC in `icParser.js`) and rejects any report
  date earlier than it — same IC parsing rule documented in `WIZARD_TEST_DATA.md`.
  Persona A's IC `650515-14-5677` → birth date `1965-05-15`; Persona B's `681203-08-5432` →
  `1968-12-03`.
  Note: `parseICNumber`'s century rule (`2000+YY` if `YY ≤ 25`, else `1900+YY`) means an IC with
  `YY` in the 1960s/1990s always resolves to the 1900s century here, matching the wizard test data.
- **Reminder date bounds**: `handleSubmitReminder` in `HealthReportController.jsx` rejects a reminder
  datetime that is in the past or more than 5 years from now (`new Date().setFullYear(+5)`).
- **File validation**: `validateFile` in `HealthReport.js` (10MB limit, PDF/JPEG/PNG/WEBP only) applies to
  the single-file upload path (`uploadHealthReport`); the multi-file path
  (`handleMultipleFileUpload`) instead runs files through `processPDF`/`convertImagesToPDF` without a
  hard size/type gate beyond what those utilities accept.
- **Support subject values** (`inquiries` / `health_report` / `nominee`) are the literal `value="..."`
  strings from the subject `<select>` in `UserSupportView.jsx`; `UserSupport.createInquiry` stores
  whatever string is passed with no enum validation server-side, so typos would silently create an
  inquiry with an unrecognized subject (displayed as-is by `formatSubject`).
- **Resolved-inquiry lock**: enforced client-side only, in
  `UserSupportController.handleSendMessage` (`selectedInquiry.status === 'resolved'` check) and hidden in
  `UserSupportView` — there's no corresponding DB-level constraint, so this is a UI/business-logic rule
  worth testing directly.
