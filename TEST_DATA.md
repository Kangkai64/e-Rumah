# e-Rumah Test Data — Full Presentation Flow

Ready-to-type values for a live, end-to-end walkthrough: **Register → Login → Application Wizard →
Health Reports → Support → Admin actions**. Sections are ordered so you can go top-to-bottom during a
demo/presentation without jumping between files. Replaces the former `WIZARD_TEST_DATA.md` and
`HEALTH_SUPPORT_TEST_DATA.md`.

Two personas carry through the **entire** flow (registration → wizard → health reports → support):

- **Persona A — Single applicant, single nominee.** Simplest path. Use this first to validate the happy
  path (AM-06/AM-16 in the testing checklist).
- **Persona B — Joint applicant + two nominees.** Exercises every conditional block (Step 2 joint-applicant
  fields, Step 4 second nominee, lump-sum usage, leasehold expiry, fire insurance).

**Profiles 3–12** are ten additional wizard-only applicants (register the same way, then go straight to
the wizard) covering every race/marital-status/present-house/property-type/payout/lump-sum-usage/
fire-insurance value and all four joint-applicant relationships bar one — use these for eligibility-rule
breadth testing, not the health/support walkthrough.

All values are constructed to pass every rule in `src/utils/applicationValidation.js`,
`src/utils/emailBlacklist.js`, `HealthReportController.jsx`, and `RegistrationPage.jsx` as of 2026-07-09 —
see "How these were derived" at the bottom of each part.

**Email domain note:** `example.com`/`.org`/`.net` are reserved documentation domains (RFC 2606) and are
now in `TEMP_EMAIL_DOMAINS` (`src/utils/emailBlacklist.js`), so every email below uses `gmail.com`
instead. If you see `@example.com` anywhere else in this repo, it needs the same fix.

Each applicant/joint-applicant IC is a _valid format_ Malaysian IC (place-of-birth code 01–59, i.e. not a
PR) that resolves to an age ≥ 55 today. Nominee ICs are valid-format Malaysian ICs with no age floor. None
of these numbers are real people's ICs — they are algorithmically constructed test values.

---

## Part 1 — Registration (`/register`)

`RegistrationPage.jsx` collects Full Name, IC Number, Phone, Email, Confirm Email, Password, Confirm
Password. The IC/name/email/phone entered here auto-fill Step 1 of the application wizard later, so use
the **same values** in both places for each persona.

| Field            | Persona A                | Persona B                |
| ---------------- | ------------------------ | ------------------------ |
| Full Name        | `Ahmad Bin Ismail`       | `Salmah Binti Yusof`     |
| IC Number        | `650515-14-5677`         | `681203-08-5432`         |
| Phone Number     | `012-3456789`            | `019-8765432`            |
| Email Address    | `ahmad.ismail@gmail.com` | `salmah.yusof@gmail.com` |
| Confirm Email    | `ahmad.ismail@gmail.com` | `salmah.yusof@gmail.com` |
| Password         | `eRumah2026!`            | `eRumah2026!`            |
| Confirm Password | `eRumah2026!`            | `eRumah2026!`            |

Profiles 3–12 (see Part 4) register the same way: Full Name = their name, IC Number = their applicant
NRIC, Phone = their Telephone value, Email = the `@gmail.com` address listed in that profile's row,
Password = `eRumah2026!` for all of them.

After submitting, you're redirected to `/login`.

### How these were derived

- Password `eRumah2026!` satisfies all five requirements (≥8 chars, upper, lower, number, special) and
  contains none of the applicant's email local-part or name-part substrings (the registration form
  rejects a password containing either) — verified against every persona/profile name and email used in
  this document.
- IC/email/name are identical to the wizard values (Part 3/4) because `ApplicationController` auto-fills
  Step 1 from the `users` table row created at registration (`nameAsPerNRIC`, `email`, `nricNo`,
  `telephone` default to the profile's values if the wizard field is empty).

---

## Part 2 — Login (`/login`)

Use the email + password from Part 1 (`UserLoginPage.jsx`). No email-format/blacklist check runs here —
it's a credential check against the account you already registered, not new input.

| Field    | Persona A                | Persona B                |
| -------- | ------------------------ | ------------------------ |
| Email    | `ahmad.ismail@gmail.com` | `salmah.yusof@gmail.com` |
| Password | `eRumah2026!`            | `eRumah2026!`            |

---

## Part 3 — Application Wizard: Persona A (single applicant, single nominee)

### Step 1 — Personal Information

| Field                      | Value                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| How did you know about SSB | `family/friends`                                                                                                       |
| NRIC No.                   | `650515-14-5677` (auto-filled from registration; auto-fills DOB 15/05/1965, Sex: Male, Citizenship: Malaysian Citizen) |
| Name as per NRIC           | `Ahmad Bin Ismail` (auto-filled from registration)                                                                     |
| Race                       | `Malay`                                                                                                                |
| Marital Status             | `Married`                                                                                                              |
| Address                    | `12 Jalan Bunga Raya, Taman Melati`                                                                                    |
| Postcode                   | `53100`                                                                                                                |
| Email                      | `ahmad.ismail@gmail.com` (auto-filled from registration)                                                               |
| Residence Phone (optional) | `03-4021234`                                                                                                           |
| Telephone (mobile)         | `012-3456789` (auto-filled from registration)                                                                          |
| Number of Dependents       | `0`                                                                                                                    |
| Present House Ownership    | `own`                                                                                                                  |
| Occupation                 | `Retired Teacher`                                                                                                      |
| Employer Name              | `Sekolah Kebangsaan Taman Melati` (former employer, pre-retirement)                                                    |
| Employer Address           | `Jalan Melati 5, Taman Melati`                                                                                         |
| Employer Postcode          | `53100`                                                                                                                |
| Purpose of Application     | `Supplement retirement income`                                                                                         |
| Payout Option              | `Monthly Payout only`                                                                                                  |
| Payment Option             | `To be paid by borrower/customer`                                                                                      |
| Documents                  | Upload any small PDF/image for: Applicant NRIC, Birth Certificate, 3× Payslips, 6× Bank Statements, EPF Statement      |

Joint applicant: leave **"Do you have a joint applicant?"** unchecked.

### Step 2 — Banking (no joint applicant)

| Field              | Value           |
| ------------------ | --------------- |
| Bank Name          | `Maybank`       |
| Account Type       | `savings`       |
| Account Number     | `1234567890123` |
| Account Preference | `conventional`  |

### Step 3 — Property Details

| Field                   | Value                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| Property Type           | `high-rise`                                                                      |
| Property Address        | `Unit 5-3, Pangsapuri Melati, Jalan Melati 5`                                    |
| Scheme Name             | `Pangsapuri Melati`                                                              |
| District                | `Klang`                                                                          |
| Mukim                   | `Kapar`                                                                          |
| Postcode                | `43000` _(must NOT be one of the excluded KL_POSTCODES values — see note below)_ |
| Indicative Market Value | `450000`                                                                         |
| Valuation Date          | `01/06/2026`                                                                     |
| Expected Market Value   | `460000`                                                                         |
| Purchase Price          | `380000`                                                                         |
| Purchase Date           | `10/03/2010`                                                                     |
| Tenure/Title            | `freehold`                                                                       |
| Build-up Area (sqm)     | `950`                                                                            |
| Land Area (sqm)         | `950`                                                                            |
| Property Encumbered     | `no`                                                                             |
| Fire Insurance          | `notAvailable`                                                                   |
| Fire Insurance Renewal  | `cagamasRenew`                                                                   |
| Documents               | Grant/Title, Sale Agreement, Valuation Report                                    |

### Step 4 — Nominee

| Field                               | Value                               |
| ----------------------------------- | ----------------------------------- |
| Add second nominee?                 | leave unchecked                     |
| Nominee 1 Salutation                | `Mr`                                |
| Nominee 1 Name                      | `Amir Bin Ahmad`                    |
| Nominee 1 IC                        | `950214-14-6543`                    |
| Nominee 1 Address                   | `12 Jalan Bunga Raya, Taman Melati` |
| Nominee 1 Postcode                  | `53100`                             |
| Nominee 1 Email                     | `amir.ahmad@gmail.com`              |
| Nominee 1 Residence Phone           | `03-4021234`                        |
| Nominee 1 Telephone                 | `013-2345678`                       |
| Nominee 1 Race                      | `Malay`                             |
| Nominee 1 Marital Status            | `Single`                            |
| Nominee 1 Malaysian (checkbox)      | checked                             |
| Nominee 1 Relationship to Applicant | `Son`                               |
| Nominee 1 Occupation                | `Engineer`                          |
| Nominee 1 Employer Name             | `Petronas`                          |

### Step 5 — Declaration / Signatures

Draw any signature for **Applicant Signature**; Signature Name must equal `Ahmad Bin Ismail`; Signature
Date = today. Check Privacy Consent + Acknowledge Declaration.

### Step 6 — Acknowledgement Form

All values here must **match Steps 1/4 exactly** (validated by `validateFieldMatches`):

- Nominee Name: `Amir Bin Ahmad`, Nominee NRIC: `950214-14-6543`, Nominee Address: `12 Jalan Bunga Raya, Taman Melati`
- Applicant Name: `Ahmad Bin Ismail`, Applicant NRIC: `650515-14-5677`, Applicant Address: `12 Jalan Bunga Raya, Taman Melati`
- Application Date / Ack Date: today's date
- Signatory Name: `Ahmad Bin Ismail`, Signatory IC: `650515-14-5677`
- Check "Nominee Consent"; draw the acknowledgement signature.

### Step 7 — Review & Submit

No input — verify every field above renders correctly, then Submit. Status becomes `submitted`, which
unlocks `/user/health-reports` and `/user/support` immediately (see Parts 5–6).

---

## Part 4 — Application Wizard: Persona B (joint applicant + two nominees)

### Step 1 — Personal Information

| Field                      | Value                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| How did you know about SSB | `website`                                                                                                                |
| NRIC No.                   | `681203-08-5432` (auto-filled from registration; auto-fills DOB 03/12/1968, Sex: Female, Citizenship: Malaysian Citizen) |
| Name as per NRIC           | `Salmah Binti Yusof` (auto-filled from registration)                                                                     |
| Race                       | `Malay`                                                                                                                  |
| Marital Status             | `Married`                                                                                                                |
| Address                    | `88 Jalan Anggerik, Taman Orkid`                                                                                         |
| Postcode                   | `40450`                                                                                                                  |
| Email                      | `salmah.yusof@gmail.com` (auto-filled from registration)                                                                 |
| Residence Phone            | `03-5512345`                                                                                                             |
| Telephone (mobile)         | `019-8765432` (auto-filled from registration)                                                                            |
| Number of Dependents       | `1` → Dependent Age 1: `30`                                                                                              |
| Present House Ownership    | `mortgaged`                                                                                                              |
| Occupation                 | `Retired Nurse`                                                                                                          |
| Employer Name              | `Hospital Tengku Ampuan Rahimah` (former employer, pre-retirement)                                                       |
| Employer Address           | `Jalan Langat, Klang`                                                                                                    |
| Employer Postcode          | `41200`                                                                                                                  |
| Purpose of Application     | `Supplement retirement income and medical costs`                                                                         |
| Payout Option              | `Monthly Payout and Lump Sum`                                                                                            |
| Lump Sum Usage             | `Payment for medical expenses`                                                                                           |
| Payment Option             | `To be advanced by Organization`                                                                                         |
| Documents                  | Applicant NRIC, Birth Certificate, 3× Payslips, 6× Bank Statements, EPF Statement                                        |

Joint applicant: check **"Do you have a joint applicant?"**.

### Step 2 — Joint Applicant & Banking

| Field                       | Value                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Salutation                  | `Mr`                                                                               |
| Name                        | `Rahman Bin Osman`                                                                 |
| IC                          | `620728-14-5951` (age 63, valid)                                                   |
| Address                     | `88 Jalan Anggerik, Taman Orkid`                                                   |
| Postcode                    | `40450`                                                                            |
| Email                       | `rahman.osman@gmail.com`                                                           |
| Residence Phone             | `03-5512345`                                                                       |
| Telephone                   | `017-6543210`                                                                      |
| Race                        | `Malay`                                                                            |
| Marital Status              | `Married`                                                                          |
| Relationship with Applicant | `spouse`                                                                           |
| Occupation                  | `Retired Civil Servant`                                                            |
| Employer Name               | `Jabatan Perkhidmatan Awam Malaysia` (former employer, pre-retirement)             |
| Employer Address            | `Aras 6, Blok C1, Kompleks Kerajaan Persekutuan, Presint 1`                        |
| Employer Postcode           | `62510`                                                                            |
| Documents                   | Joint Applicant NRIC                                                               |
| Bank Name                   | `CIMB Bank`                                                                        |
| Account Type                | `joinAccountSaving` _(must be a joint account type when a joint applicant exists)_ |
| Account Number              | `9988776655443`                                                                    |
| Account Preference          | `islamic`                                                                          |

### Step 3 — Property Details

| Field                   | Value                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Property Type           | `terrace`                                                                                                                  |
| Property Address        | `No. 7, Jalan Delima 3, Bandar Baru`                                                                                       |
| Scheme Name             | `Bandar Baru Delima`                                                                                                       |
| District                | `Kuala Selangor`                                                                                                           |
| Mukim                   | `Ijok`                                                                                                                     |
| Postcode                | `43200` _(must NOT be one of the excluded KL_POSTCODES values — see note below)_                                           |
| Indicative Market Value | `600000`                                                                                                                   |
| Valuation Date          | `15/05/2026`                                                                                                               |
| Expected Market Value   | `620000`                                                                                                                   |
| Purchase Price          | `500000`                                                                                                                   |
| Purchase Date           | `20/01/2005`                                                                                                               |
| Tenure/Title            | `leasehold`                                                                                                                |
| Lease Expiry Date       | `01/01/2140` _(≥ 90 years remaining from today, per the leasehold rule)_                                                   |
| Build-up Area (sqm)     | `1400`                                                                                                                     |
| Land Area (sqm)         | `1600`                                                                                                                     |
| Property Encumbered     | `no` _(SSB now hard-blocks submission if `yes` — see note below)_                                                          |
| Fire Insurance          | `inForce` → Insurance Company: `Etiqa Insurance`, Period of Validity: `01/01/2026 - 31/12/2026`, upload Fire Insurance doc |
| Fire Insurance Renewal  | `selfRenewal`                                                                                                              |
| Documents               | Grant/Title, Sale Agreement, Valuation Report, Fire Insurance                                                              |

### Step 4 — Nominees

| Field                     | Nominee 1                        | Nominee 2                        |
| ------------------------- | -------------------------------- | -------------------------------- |
| Add second nominee?       | —                                | check the box                    |
| Salutation                | `Mr`                             | `Ms`                             |
| Name                      | `Faizal Bin Rahman`              | `Farah Binti Rahman`             |
| IC                        | `970118-14-5439`                 | `980730-10-4322`                 |
| Address                   | `88 Jalan Anggerik, Taman Orkid` | `88 Jalan Anggerik, Taman Orkid` |
| Postcode                  | `40450`                          | `40450`                          |
| Email                     | `faizal.rahman@gmail.com`        | `farah.rahman@gmail.com`         |
| Residence Phone           | `03-5512345`                     | `03-5512345`                     |
| Telephone                 | `013-2345678`                    | `014-9876543`                    |
| Race                      | `Malay`                          | `Malay`                          |
| Marital Status            | `Single`                         | `Single`                         |
| Malaysian (checkbox)      | checked                          | checked                          |
| Relationship to Applicant | `Son`                            | `Daughter`                       |
| Occupation                | `Accountant`                     | `Doctor`                         |
| Employer Name             | `KPMG`                           | `Hospital Kuala Lumpur`          |

### Step 5 — Declaration / Signatures

Applicant signature (name = `Salmah Binti Yusof`) **and** joint applicant signature (name = `Rahman Bin
Osman`, since `isJointApplicant` is true). Check Privacy Consent + Acknowledge Declaration.

### Step 6 — Acknowledgement Form

- Nominee Name: `Faizal Bin Rahman`, Nominee NRIC: `970118-14-5439`, Nominee Address: `88 Jalan Anggerik, Taman Orkid`
- Applicant Name: `Salmah Binti Yusof`, Applicant NRIC: `681203-08-5432`, Applicant Address: `88 Jalan Anggerik, Taman Orkid`
- Joint Applicant Name: `Rahman Bin Osman`, Joint Applicant NRIC: `620728-14-5951`
- Application Date / Ack Date: today's date
- Signatory Name: `Salmah Binti Yusof`, Signatory IC: `681203-08-5432`
- Check "Nominee Consent"; draw the acknowledgement signature.

### Step 7 — Review & Submit

Verify the joint applicant, second nominee, leasehold/fire-insurance conditional fields all render, then
Submit.

---

## Part 5 — Health Reports & Reminders (`/user/health-reports`)

Log in as Persona A or B (Part 2) after submitting their wizard application (Part 3/4) — `submitted`
status is enough to unlock this route.

### 1. Upload Health Reports (multi-file upload modal)

| Field               | Entry 1                        | Entry 2                | Entry 3                         | Entry 4                        |
| ------------------- | ------------------------------ | ---------------------- | ------------------------------- | ------------------------------ |
| Report Type         | `Medical Report`               | `Lab Test`             | `Prescription`                  | `Doctor's Visit Summary`       |
| Report Date         | `2026-06-01`                   | `2026-05-15`           | `2026-06-20`                    | `2026-07-01`                   |
| Report Title        | `Annual Health Checkup`        | `Blood Test Results`   | `Hypertension Medication`       | `Cardiology Follow-up`         |
| Healthcare Provider | `Hospital Kuala Lumpur`        | `Gleneagles KL`        | `Klinik Kesihatan Taman Melati` | `Pantai Hospital Kuala Lumpur` |
| File                | `incomeStatement1.png` (dummy) | `incomeStatement2.png` | `payslip1.jpg`                  | `payslip2.jpg`                 |

A 5th entry to exercise the "Others" custom-type field:

| Field               | Value                          |
| ------------------- | ------------------------------ |
| Report Type         | `Others`                       |
| Custom Report Type  | `Physiotherapy Session Notes`  |
| Report Date         | `2026-06-10`                   |
| Report Title        | `Knee Physiotherapy Session 3` |
| Healthcare Provider | `Sunway Medical Centre`        |
| File                | `payslip3.png`                 |

Report Date must be on/after the applicant's derived birth date (`650515` → `1965-05-15` for Persona A,
`681203` → `1968-12-03` for Persona B) and is otherwise unrestricted, so any date from that birth date up
to today works.

### 2. Reminders

| Field               | Reminder 1                          | Reminder 2                      |
| ------------------- | ----------------------------------- | ------------------------------- |
| Title               | `Follow-up Blood Pressure Check`    | `Refill Diabetes Medication`    |
| Type                | `Doctor visit`                      | `Medication refill`             |
| Date                | `2026-07-20`                        | `2026-07-15`                    |
| Time                | `10:00`                             | `09:00`                         |
| Category            | `Health & appointments`             | `Medication`                    |
| Notes               | `Bring previous blood pressure log` | `Check with pharmacy for stock` |
| Frequencies enabled | 1 week, 3 days, 1 day (all)         | 3 days, 1 day                   |

Reminder date+time must be strictly in the future (relative to now) and no more than 5 years out.

### 3. Sharing a Health Report

Only `link` and `email` share options work without extra setup (`caregiver`/`family`/`healthcare` require
a pre-existing verified row in `caregivers`/`family_members`/`healthcare_providers` linked to a real user
account, which is out of scope for basic UI testing). The share-email field now runs the same format +
blacklist check as every other email input (added to `HealthReportController.handleShareSubmit`):

| Field        | Value (link option) | Value (email option)         |
| ------------ | ------------------- | ---------------------------- |
| Share Option | `link`              | `email`                      |
| Expiry Days  | `7`                 | `30`                         |
| Email        | —                   | `caretaker.family@gmail.com` |

The generated link resolves to `/shared-report/:token` — public route, no login required — and should
show the report until `expiryDays` elapse or it's revoked.

---

## Part 6 — Support (`/user/support`)

### 1. Creating an Inquiry

| Field   | Inquiry 1                                                                           | Inquiry 2                                                                                 | Inquiry 3                                                          |
| ------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Subject | `inquiries` (General Inquiries)                                                     | `health_report` (Health Report)                                                           | `nominee` (Nominee)                                                |
| Message | `I haven't received an update on my loan disbursement schedule. Can someone check?` | `My latest health report was flagged — can you tell me what's missing so I can reupload?` | `I need to update my nominee's contact address, how do I do that?` |

Subject must be exactly one of `inquiries` / `health_report` / `nominee` (hardcoded `<option>` values in
`UserSupportView.jsx`); message is free text with no length limit enforced in `UserSupport.createInquiry`.

### 2. Sending Messages

| Scenario              | Message                                        | File                                                                            |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Text-only reply       | `Thanks, I'll wait for the update.`            | none                                                                            |
| Reply with attachment | `Here's a screenshot of the error I'm seeing.` | any small image                                                                 |
| File-only (no text)   | _(leave message blank)_                        | any small file — controller substitutes `(File attachment)` as the message text |

Sending is blocked entirely once `selectedInquiry.status === 'resolved'` (checked in
`UserSupportController.handleSendMessage`), and the input area is hidden/disabled in the view too.

---

## Part 7 — Staff-side actions

### Admin — Health Reports (`/admin/health-reports`)

| Action   | Input                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------- |
| Approve  | No input — click Approve, confirm.                                                              |
| Flag     | Flag Reason: `Report appears incomplete — missing doctor's signature.`                          |
| Archive  | No input — click Archive, confirm.                                                              |
| Reupload | Select any small PDF/JPG/PNG/WEBP file to replace the existing one; status resets to `Pending`. |

### Customer Support staff (`/support/dashboard`)

| Action                                       | Input                                                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Reply to inquiry                             | `Thanks for reaching out — we've forwarded this to the relevant team.`                                                            |
| Change status                                | `open` → `in_progress` → `resolved` (staff-only transition)                                                                       |
| View flagged health reports / nominee issues | Use the entries created in Part 5/7 above                                                                                         |
| Website Contact Settings                     | Contact Email: `support@erumah.com` (format + blacklist checked — `isTempEmail` now runs here too), Contact Phone: `03-1112 9429` |

---

## Negative-path values (for validation testing)

| Scenario                                  | Value to try                                                        | Expected result                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Under-age applicant                       | NRIC `050101-14-5432` (age ~21)                                     | Blocked: "must be at least 55 years old"                                                             |
| PR / foreign-born applicant               | NRIC `650515-75-5677` (place-of-birth code 75)                      | Blocked: "must be a Malaysian citizen... PR are not eligible"                                        |
| Malformed IC                              | `650515-1-5677`                                                     | "IC must be in format: xxxxxx-xx-xxxx"                                                               |
| Excluded property postcode                | Property Postcode `41100` (or any of the 13 excluded values)        | Blocked: "This postcode is excluded from eligibility"                                                |
| Leasehold with < 90 years left            | Lease Expiry Date `01/01/2050`                                      | Blocked: remaining lease must be ≥ 90 years                                                          |
| Encumbered property                       | Property Encumbered `yes`                                           | Blocked: "Property must be free from encumbrances... requirement for SSB eligibility"                |
| Duplicate nominee = applicant             | Nominee IC same as applicant's IC                                   | Blocked: duplicate person check                                                                      |
| Invalid postcode format                   | Postcode `1234`                                                     | "Postcode must be 5 digits"                                                                          |
| Invalid email                             | `not-an-email`                                                      | "Invalid email format"                                                                               |
| Temporary/disposable email                | `user@mailinator.com`                                               | "Temporary email addresses are not allowed"                                                          |
| Reserved/example email domain             | `tester@example.com`                                                | "Temporary email addresses are not allowed" (added to the blacklist — was previously accepted)       |
| Bad account number                        | `12345` (< 8 digits)                                                | "Account Number must contain 8 to 16 digits"                                                         |
| Report date before birth date             | Report Date `1960-01-01` (Persona A, born 1965)                     | "Report date cannot be earlier than your birth date"                                                 |
| Missing report type                       | Leave Report Type unselected                                        | "Please select a report type"                                                                        |
| "Others" with no custom type              | Report Type `Others`, Custom Report Type blank                      | "Please specify custom report type"                                                                  |
| Oversized/wrong-type file (single upload) | A file > 10MB, or a `.docx`                                         | "File size exceeds 10MB limit" / "Invalid file type. Only PDF, JPG, PNG, and WEBP files are allowed" |
| Flag report with no reason                | Leave Flag Reason blank, submit                                     | "Flag reason is required"                                                                            |
| Reminder date in the past                 | Reminder Date `2026-01-01`, any past time                           | "Reminder date and time cannot be in the past"                                                       |
| Reminder date too far in the future       | Reminder Date `2032-01-01`                                          | "Reminder date is too far in the future"                                                             |
| Reminder enabled with no frequency        | `is_enabled=true`, uncheck all of 1 week/3 days/1 day               | "Please enable at least one reminder frequency"                                                      |
| Share via email with blacklisted domain   | Share Option `email`, Email `user@mailinator.com`                   | "Temporary email addresses are not allowed" (now checked before the share request is sent)           |
| Message sent to a resolved inquiry        | Select a `resolved` inquiry, try to send a message                  | "This inquiry has been resolved" (blocked before any request is made)                                |
| Empty message + no file                   | Leave message blank, no file attached, click Send                   | "Message or file required"                                                                           |
| Share with unregistered caregiver email   | Share Option `caregiver`, Email of a user not in `caregivers` table | "User found but they are not registered as a caregiver" (or "No user found...")                      |

---

## Profiles 3–12 — additional wizard applicants (compact reference)

Ten more ready-to-type applicants, numbered on from Persona A (1) and B (2), for wizard-only breadth
testing (register each with the same values per Part 1's note, then skip straight to the wizard). Each is
independently valid against every check in `applicationValidation.js` — distinct ICs (no duplicates
across this whole document), applicant/joint-applicant age ≥ 55, non-excluded property postcode,
`propertyEncumbered: no`, and a `renewalFireInsurance` selection. Profiles 5, 7 and 10 have a joint
applicant; all others are single-applicant. Step 5 (signature name/date = applicant's own name/today) and
Step 6 (acknowledgement fields copied verbatim from Steps 1/4) follow the same pattern as Persona A/B and
aren't repeated per-row. For every profile, Step 1 documents = Applicant NRIC + Birth Certificate + 3
Payslips + 6 Bank Statements + EPF Statement; Step 3 documents = Grant/Title + Sale Agreement + Valuation
Report (+ Fire Insurance doc when `fireInsurance: inForce`); Step 4 documents = 1 doc per nominee (NRIC).

### Applicant identity & contact

| #   | Name                      | NRIC (age/sex)           | Race    | Marital  | Address / Postcode                              | Email                      | Telephone      | Residence Phone | Dependents      | Present House |
| --- | ------------------------- | ------------------------ | ------- | -------- | ----------------------------------------------- | -------------------------- | -------------- | --------------- | --------------- | ------------- |
| 3   | Zulkifli Bin Hassan       | `600110-08-5433` (66, M) | Malay   | Married  | 21 Jalan Meranti, Taman Meranti / `47301`       | zulkifli.hassan@gmail.com  | `012-3344556`  | `03-7891234`    | 0               | own           |
| 4   | Lee Mei Ling              | `620825-10-6242` (63, F) | Chinese | Widowed  | 9 Jalan Cempaka, Taman Cempaka / `68100`        | meiling.lee@gmail.com      | `013-5566778`  | `03-6291234`    | 2 (ages 35, 32) | family        |
| 5   | Suresh A/L Muthu          | `580317-05-5461` (68, M) | Indian  | Married  | 5 Jalan Anggerik, Taman Seri Anggerik / `70200` | suresh.muthu@gmail.com     | `019-2233445`  | `03-2091234`    | 0               | own           |
| 6   | Rosli Bin Kassim          | `570622-02-5715` (69, M) | Malay   | Divorced | 18 Jalan Sena, Taman Sena / `05000`             | rosli.kassim@gmail.com     | `011-23445566` | `03-7423456`    | 1 (age 40)      | family        |
| 7   | Balasubramaniam A/L Rajoo | `590214-12-5637` (67, M) | Other   | Single   | 6 Jalan Tanjung, Taman Tanjung / `88300`        | bala.rajoo@gmail.com       | `016-7788990`  | `03-8891234`    | 0               | mortgaged     |
| 8   | Kavitha A/P Ramasamy      | `650430-01-5648` (61, F) | Indian  | Married  | 14 Jalan Seroja, Taman Seroja / `80100`         | kavitha.ramasamy@gmail.com | `018-2233445`  | `03-7123456`    | 0               | own           |
| 9   | Tan Ah Kow                | `590911-07-5539` (66, M) | Chinese | Widowed  | 3 Lorong Timah, Taman Timah / `11700`           | tan.ahkow@gmail.com        | `012-8899001`  | `03-4045678`    | 0               | rented        |
| 10  | Zainab Binti Omar         | `600505-14-5462` (66, F) | Malay   | Married  | 10 Jalan Mawar, Taman Mawar / `56000`           | zainab.omar@gmail.com      | `019-3344556`  | `03-9123456`    | 0               | own           |
| 11  | Jimmy Anak Belaga         | `610703-13-5511` (65, M) | Other   | Married  | 4 Jalan Satok, Taman Satok / `93350`            | jimmy.belaga@gmail.com     | `013-8899001`  | `03-4823456`    | 0               | family        |
| 12  | Norhayati Binti Rahim     | `630228-09-5628` (63, F) | Malay   | Single   | 7 Jalan Kangar, Taman Kangar / `01000`          | norhayati.rahim@gmail.com  | `014-9900112`  | `03-5723456`    | 0               | mortgaged     |

### Employment, purpose & banking

| #   | Occupation               | Employer Name (former, pre-retirement)           | Employer Address / Postcode                       | Purpose                                                   | Payout Option (+ Lump Sum Usage)                      | Payment Option | How did you know   | Bank / Account Type / Account No. / Preference                         |
| --- | ------------------------ | ------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- | -------------- | ------------------ | ---------------------------------------------------------------------- |
| 3   | Retired Clerk            | Majlis Bandaraya Petaling Jaya (MBPJ)            | Jalan Yong Shook Lin, Petaling Jaya / `46675`     | Supplement retirement income                              | `monthlyPayout`                                       | `toBePaid`     | google             | Public Bank / `savings` / `2233445566` / conventional                  |
| 4   | Retired Accountant       | Tenaga Nasional Berhad (TNB)                     | Bangunan TNB, Jalan Bangsar / `59200`             | Supplement retirement income and medical costs            | `monthlyPayout_lumpSum` → `medicalExpenses`           | `toBePaid`     | social_media       | Hong Leong Bank / `savings` / `3344556677889` / conventional           |
| 5   | Retired Estate Manager   | Sime Darby Plantation Berhad                     | Ladang Bahau, Seremban / `71800`                  | Supplement retirement income                              | `monthlyPayout`                                       | `toBePaid`     | expo               | Bank Rakyat / `joinAccountSaving` / `4455667788` / islamic             |
| 6   | Retired Businessman      | Kassim Trading Enterprise                        | Jalan Kampung Baru, Alor Setar / `05000`          | Supplement retirement income and settle outstanding debts | `monthlyPayout_lumpSum` → `settleOutstandingMortgage` | `toBeAdvanced` | tv/radio/newspaper | Bank Islam / `savings` / `55667788` / islamic                          |
| 7   | Retired Surveyor         | Jabatan Ukur dan Pemetaan Malaysia (JUPEM Sabah) | Jalan Tunku Abdul Rahman, Kota Kinabalu / `88450` | Supplement retirement income                              | `monthlyPayout`                                       | `toBePaid`     | website            | Standard Chartered / `joinAccountSaving` / `6677889900` / conventional |
| 8   | Retired Bank Officer     | Maybank Berhad                                   | Jalan Wong Ah Fook, Johor Bahru / `80000`         | Supplement retirement income                              | `monthlyPayout`                                       | `toBePaid`     | family/friends     | OCBC Bank / `savings` / `778899001122` / conventional                  |
| 9   | Retired Fisherman        | Lembaga Kemajuan Ikan Malaysia (LKIM)            | Jalan Sungai Nibong Kecil, Bayan Lepas / `11960`  | Supplement retirement income for home refurbishment       | `monthlyPayout_lumpSum` → `maintenance`               | `toBePaid`     | google             | Affin Bank / `savings` / `99001122` / conventional                     |
| 10  | Retired School Principal | Kementerian Pendidikan Malaysia                  | Sekolah Menengah Kebangsaan Cheras / `56000`      | Supplement retirement income                              | `monthlyPayout`                                       | `toBePaid`     | expo               | Alliance Bank / `jointAccountCurrent` / `8899001122` / islamic         |
| 11  | Retired Forest Ranger    | Jabatan Perhutanan Sarawak                       | Wisma Sumber Alam, Petra Jaya, Kuching / `93660`  | Supplement retirement income                              | `monthlyPayout`                                       | `toBePaid`     | social_media       | Maybank / `savings` / `11223344` / conventional                        |
| 12  | Retired Librarian        | Perpustakaan Negara Malaysia (Cawangan Perlis)   | Jalan Bukit Lagi, Kangar / `01000`                | Supplement retirement income and medical costs            | `monthlyPayout_lumpSum` → `medicalExpenses`           | `toBeAdvanced` | tv/radio/newspaper | CIMB Bank / `savings` / `2200334455` / islamic                         |

### Joint applicants (Profiles 5, 7, 10 only)

| #   | Salutation | Name                | NRIC (age/sex)           | Email                     | Telephone     | Race   | Marital | Relationship | Occupation                 | Employer Name / Address / Postcode                                                                 |
| --- | ---------- | ------------------- | ------------------------ | ------------------------- | ------------- | ------ | ------- | ------------ | -------------------------- | -------------------------------------------------------------------------------------------------- |
| 5   | Mdm        | Kamala A/P Krishnan | `600925-05-5522` (65, F) | kamala.krishnan@gmail.com | `012-6677889` | Indian | Married | `spouse`     | Retired Nurse              | Hospital Tuanku Jaafar / Jalan Rasah, Seremban / `70300`                                           |
| 7   | Ms         | Vasanthi A/P Rajoo  | `610730-12-5748` (64, F) | vasanthi.rajoo@gmail.com  | `017-9900112` | Other  | Single  | `siblings`   | Retired Clerk              | Jabatan Tanah dan Ukur Sabah / Jalan Tunku Abdul Rahman, Kota Kinabalu / `88450`                   |
| 10  | Dato'      | Ismail Bin Ahmad    | `400118-14-5211` (86, M) | ismail.ahmad@gmail.com    | `012-4455667` | Malay  | Widowed | `parent`     | Retired Government Servant | Jabatan Perkhidmatan Awam Malaysia / Kompleks Kerajaan Persekutuan, Presint 1, Putrajaya / `62510` |

Joint applicant's Address/Postcode/Residence Phone = same as the applicant's in the table above. Account
type for these three profiles is already the required joint type (see banking table above).

### Property details

| #   | Type          | Address / Scheme / District / Mukim                                                           | Postcode | Market Value → Expected | Purchase Price / Date | Tenure (Expiry if leasehold) | Build-up / Land (sqm) | Fire Insurance                                          | Renewal        |
| --- | ------------- | --------------------------------------------------------------------------------------------- | -------- | ----------------------- | --------------------- | ---------------------------- | --------------------- | ------------------------------------------------------- | -------------- |
| 3   | `terrace`     | No. 15, Jalan Damai 2, Bandar Damai / Bandar Damai / Petaling / Damansara                     | `47301`  | 380000 → 12             | 250000 / 12/08/2001   | `freehold`                   | 1200 / 1400           | `notAvailable`                                          | `cagamasRenew` |
| 4   | `high-rise`   | Unit 12-2, Kondominium Cempaka, Jalan Cempaka 3 / Kondominium Cempaka / Gombak / Batu         | `68100`  | 320000 → 330000         | 200000 / 15/11/2008   | `leasehold` (`01/01/2135`)   | 900 / 900             | `inForce` → Allianz Malaysia, `01/01/2026 - 31/12/2026` | `selfRenewal`  |
| 5   | `semi-detach` | No. 3, Jalan Seri Anggerik 2, Taman Seri Anggerik / Taman Seri Anggerik / Seremban / Seremban | `70200`  | 550000 → 560000         | 400000 / 05/07/1998   | `freehold`                   | 1800 / 2400           | `notAvailable`                                          | `cagamasRenew` |
| 6   | `detach`      | No. 22, Jalan Bukit Indah, Taman Bukit Indah / Taman Bukit Indah / Kota Setar / Alor Setar    | `05000`  | 700000 → 720000         | 480000 / 03/09/1995   | `freehold`                   | 2500 / 3200           | `inForce` → Great Eastern, `01/02/2026 - 31/01/2027`    | `selfRenewal`  |
| 7   | `others`      | No. 8, Jalan Tanjung Aru, Taman Tanjung / Taman Tanjung / Kota Kinabalu / Kota Kinabalu       | `88300`  | 480000 → 495000         | 320000 / 18/06/2002   | `leasehold` (`01/06/2130`)   | 1600 / 1600           | `notAvailable`                                          | `cagamasRenew` |
| 8   | `terrace`     | No. 27, Jalan Seroja 5, Taman Seroja / Taman Seroja / Johor Bahru / Plentong                  | `80100`  | 410000 → 420000         | 280000 / 25/02/2006   | `freehold`                   | 1300 / 1500           | `inForce` → Tokio Marine, `01/03/2026 - 28/02/2027`     | `selfRenewal`  |
| 9   | `high-rise`   | Unit 8-1, Pangsapuri Timah, Jalan Timah 2 / Pangsapuri Timah / Timur Laut / George Town       | `11700`  | 350000 → 360000         | 220000 / 14/12/2010   | `freehold`                   | 850 / 850             | `notAvailable`                                          | `cagamasRenew` |
| 10  | `semi-detach` | No. 19, Jalan Mawar 3, Taman Mawar / Taman Mawar / Hulu Langat / Cheras                       | `56000`  | 650000 → 670000         | 500000 / 09/10/1999   | `leasehold` (`01/09/2125`)   | 2000 / 2600           | `inForce` → AIA Malaysia, `01/04/2026 - 31/03/2027`     | `selfRenewal`  |
| 11  | `bungalow`    | No. 6, Jalan Stutong, Taman Stutong / Taman Stutong / Kuching / Kuching                       | `93350`  | 590000 → 600000         | 420000 / 30/03/2004   | `freehold`                   | 2100 / 2800           | `notAvailable`                                          | `cagamasRenew` |
| 12  | `terrace`     | No. 11, Jalan Kangar 4, Taman Kangar / Taman Kangar / Perlis / Kangar                         | `01000`  | 300000 → 310000         | 190000 / 22/09/2009   | `leasehold` (`01/01/2140`)   | 1100 / 1300           | `inForce` → Zurich Malaysia, `01/05/2026 - 30/04/2027`  | `selfRenewal`  |

Valuation Date = `10/06/2026` for all 10 profiles. `propertyEncumbered` = `no` for all 10 (required — see
"How these were derived" below).

### Nominees

| #   | Nom. | Salutation | Name                 | NRIC (age/sex)           | Address/Postcode            | Email                      | Telephone     | Res. Phone   | Race    | Marital | Relationship | Occupation / Employer              |
| --- | ---- | ---------- | -------------------- | ------------------------ | --------------------------- | -------------------------- | ------------- | ------------ | ------- | ------- | ------------ | ---------------------------------- |
| 3   | 1    | Mr         | Hafiz Bin Zulkifli   | `990325-08-5147` (27, M) | same as applicant / `47301` | hafiz.zulkifli@gmail.com   | `016-2233445` | `03-7891234` | Malay   | Single  | Son          | Technician / Perodua               |
| 4   | 1    | Mr         | Kevin Lee Wei Jian   | `950612-10-6351` (31, M) | same as applicant / `68100` | kevin.lee@gmail.com        | `017-8899001` | `03-6291234` | Chinese | Single  | Son          | Software Engineer / Shopee         |
| 4   | 2    | Ms         | Grace Lee Wei Xin    | `980204-10-6524` (28, F) | same as applicant / `68100` | grace.lee@gmail.com        | `018-7766554` | `03-6291234` | Chinese | Single  | Daughter     | Pharmacist / Guardian Health       |
| 5   | 1    | Mr         | Ravi A/L Suresh      | `921115-05-5673` (33, M) | same as applicant / `70200` | ravi.suresh@gmail.com      | `014-3322110` | `03-2091234` | Indian  | Single  | Son          | Lawyer / Zul Rafique & Partners    |
| 6   | 1    | Mr         | Amirul Bin Rosli     | `940508-02-5219` (32, M) | same as applicant / `05000` | amirul.rosli@gmail.com     | `019-4455667` | `03-7423456` | Malay   | Married | Son          | Pilot / AirAsia                    |
| 6   | 2    | Ms         | Aina Binti Rosli     | `970812-02-5324` (28, F) | same as applicant / `05000` | aina.rosli@gmail.com       | `013-5566779` | `03-7423456` | Malay   | Single  | Daughter     | Teacher / SMK Alor Setar           |
| 7   | 1    | Mr         | Suresh A/L Bala      | `960217-12-5835` (30, M) | same as applicant / `88300` | suresh.bala@gmail.com      | `012-3344559` | `03-8891234` | Other   | Single  | Son          | Marine Engineer / Sabah Ports      |
| 8   | 1    | Mr         | Dinesh A/L Ramasamy  | `930615-01-5761` (33, M) | same as applicant / `80100` | dinesh.ramasamy@gmail.com  | `014-5566778` | `03-7123456` | Indian  | Single  | Son          | Civil Engineer / Gamuda            |
| 8   | 2    | Ms         | Priya A/P Ramasamy   | `960920-01-5844` (29, F) | same as applicant / `80100` | priya.ramasamy@gmail.com   | `016-6677889` | `03-7123456` | Indian  | Single  | Daughter     | Pharmacist / Caring Pharmacy       |
| 9   | 1    | Mr         | Tan Wei Ming         | `990403-07-5143` (27, M) | same as applicant / `11700` | tan.weiming@gmail.com      | `017-2233445` | `03-4045678` | Chinese | Single  | Son          | Chef / Shangri-La Hotel            |
| 10  | 1    | Mr         | Hafizuddin Bin Yusof | `920815-14-5327` (33, M) | same as applicant / `56000` | hafizuddin.yusof@gmail.com | `013-6677889` | `03-9123456` | Malay   | Married | Son          | Architect / Jabatan Kerja Raya     |
| 10  | 2    | Ms         | Aisyah Binti Yusof   | `950127-14-5468` (31, F) | same as applicant / `56000` | aisyah.yusof@gmail.com     | `014-7788990` | `03-9123456` | Malay   | Single  | Daughter     | Pharmacist / Hospital Kuala Lumpur |
| 11  | 1    | Mr         | Ricky Anak Jimmy     | `950511-13-5623` (31, M) | same as applicant / `93350` | ricky.jimmy@gmail.com      | `017-3344556` | `03-4823456` | Other   | Single  | Son          | Park Ranger / Sarawak Forestry     |
| 12  | 1    | Ms         | Aminah Binti Rahim   | `650815-09-5762` (60, F) | same as applicant / `01000` | aminah.rahim@gmail.com     | `016-8899001` | `03-5723456` | Malay   | Married | Sister       | Nurse / Hospital Kangar            |
| 12  | 2    | Mr         | Farid Bin Ahmad      | `990410-09-5837` (27, M) | same as applicant / `01000` | farid.ahmad@gmail.com      | `019-9900112` | `03-5723456` | Malay   | Single  | Nephew       | Mechanic / Proton                  |

"Malaysian" checkbox = checked for every nominee. Profiles 3, 5, 7, 9 and 11 have one nominee; the rest
have two (check "Add second nominee?" for those).

---

## How these were derived

- **IC numbers** follow the app's own parsing rule (`parseICNumber` in `icParser.js`): format
  `YYMMDD-PB-####`; place-of-birth code `01–59` = Malaysian (`60–99` = PR, rejected for SSB); the century
  is chosen dynamically so the resulting age is ≥ 55 and ≤ 120 as of today. All applicant/joint-applicant
  ICs here use `YY` in the 1960s (or earlier), giving an age ≥ 55. Nominee ICs use `YY` in the 1990s,
  giving adult but non-elderly ages (no age floor applies to nominees).
- **Property postcodes** must NOT be one of the 13 fixed values in `src/utils/klPostcodes.js`
  (`KL_POSTCODES`) — this is a hardcoded **exclusion** list (SSB Requirement 1 in `validateStep3`), not an
  allow-list, so any other 5-digit postcode passes.
- **Property must be free from encumbrances**: `propertyEncumbered` is a required radio field, but
  selecting `yes` unconditionally blocks submission ("Property must be free from encumbrances... This is
  a requirement for SSB eligibility"). Every profile in this document uses `no`.
- **Fire Insurance Renewal** (`renewalFireInsurance`) is a required radio field on Step 3 regardless of
  the Fire Insurance selection — values are `selfRenewal` or `cagamasRenew`.
- **Phone formats**: mobile/telephone must match `^\d{3}-\d{7,8}$`; residence phone (optional) must match
  `^03-\d{7}$` exactly.
- **Emails** must not use a domain in `src/utils/emailBlacklist.js` (`TEMP_EMAIL_DOMAINS`), e.g.
  `mailinator.com`, `yopmail.com`, or the reserved `example.com`/`.org`/`.net` — every email in this
  document uses `gmail.com` instead. This check now also runs on the health-report share-via-email field
  and the admin contact-settings email, which previously had no blacklist check.
- **Bank Name** is a dropdown of `src/utils/malaysianBanks.js` (`MALAYSIAN_BANKS`); typing a name under
  "Other" that closely matches a listed bank is rejected and redirected to the dropdown entry.
- **Documents**: any small file (PDF/JPG/PNG) satisfies the required-upload checks — the validation only
  checks that a document record exists, not its content.
- Every IC number across every profile in this document is distinct, including nominees —
  `check_duplicate_ic` / `check_duplicate_nominee_ic` run across _all_ applications in the database, so
  reusing an IC from a prior test run (even for a different role) will be rejected as a duplicate.
  Registration also runs `check_duplicate_email` (Gmail-dot/plus-alias aware) and `check_duplicate_ic`,
  so re-registering the same persona twice will be rejected too.
- All enum/radio values (`presentHouse`, `payoutOption`, `paymentOption`, `accountType`,
  `accountPreference`, `propertyType`, `tenureTitle`, `propertyEncumbered`, `fireInsurance`, `jRelationship`,
  `howDidYouKnow`) are copied verbatim from the `value="..."` attributes in
  `src/views/ApplicationFormView.jsx`, so the UI will render them as selected once entered/re-loaded.
- **Report type / category / reminder type enums** are copied verbatim from the `<option value="...">`
  attributes in `HealthMonitoringView.jsx` and the `REMINDER_TYPES`/`REMINDER_CATEGORIES` arrays in
  `HealthReport.js`.
- **Birth-date guard**: `HealthReportController.handleMultipleFileUpload` derives the applicant's birth
  date via `deriveUserBirthDate` (parses `YYMMDD` from the IC in `icParser.js`) and rejects any report
  date earlier than it.
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
