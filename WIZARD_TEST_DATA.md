# Application Wizard Test Data

Ready-to-type values for exercising the 7-step SSB application wizard (`ApplicationController` /
`ApplicationFormView`) end-to-end. All values are constructed to pass every rule in
`src/utils/applicationValidation.js` as of 2026-07-08 (IC format/age/PR check, KL-postcode allow-list,
phone/postcode/email regex, 90-year leasehold rule, etc.) — see "How these were derived" at the bottom.

Two personas are provided:

- **Persona A — Single applicant, single nominee.** Simplest path: `isJointApplicant=false`,
  `hasSecondNominee=false`. Use this first to validate the happy path (AM-06/AM-16 in the testing checklist).
- **Persona B — Joint applicant + two nominees.** Exercises every conditional block (Step 2 joint-applicant
  fields, Step 4 second nominee, lump-sum usage, leasehold expiry, encumbered property, fire insurance).

Each applicant/joint-applicant IC is a *valid format* Malaysian IC (place-of-birth code 01–59, i.e. not a
PR) that resolves to an age ≥ 55 today. Nominee ICs are valid-format Malaysian ICs with no age floor.
None of these numbers are real people's ICs — they are algorithmically constructed test values.

---

## Persona A — Single applicant, single nominee

### Step 1 — Personal Information
| Field | Value |
|---|---|
| How did you know about SSB | `family/friends` |
| NRIC No. | `650515-14-5677` (auto-fills DOB 15/05/1965, Sex: Male, Citizenship: Malaysian Citizen) |
| Name as per NRIC | `Ahmad Bin Ismail` |
| Race | `Malay` |
| Marital Status | `Married` |
| Address | `12 Jalan Bunga Raya, Taman Melati` |
| Postcode | `53100` |
| Email | `ahmad.ismail@example.com` |
| Residence Phone (optional) | `03-4021234` |
| Telephone (mobile) | `012-3456789` |
| Number of Dependents | `0` |
| Present House Ownership | `own` |
| Occupation | `Retired Teacher` |
| Employer Name | `N/A - Retired` |
| Employer Address | `N/A` |
| Employer Postcode | `53100` |
| Purpose of Application | `Supplement retirement income` |
| Payout Option | `Monthly Payout only` |
| Payment Option | `To be paid by borrower/customer` |
| Documents | Upload any small PDF/image for: Applicant NRIC, Birth Certificate, 3× Payslips, 6× Bank Statements, EPF Statement |

Joint applicant: leave **"Do you have a joint applicant?"** unchecked.

### Step 2 — Banking (no joint applicant)
| Field | Value |
|---|---|
| Bank Name | `Maybank` |
| Account Type | `savings` |
| Account Number | `1234567890123` |
| Account Preference | `conventional` |

### Step 3 — Property Details
| Field | Value |
|---|---|
| Property Type | `high-rise` |
| Property Address | `Unit 5-3, Pangsapuri Melati, Jalan Melati 5` |
| Scheme Name | `Pangsapuri Melati` |
| District | `Klang` |
| Mukim | `Kapar` |
| Postcode | `41100` *(must be one of the fixed KL_POSTCODES list — not a free digit)* |
| Indicative Market Value | `450000` |
| Valuation Date | `01/06/2026` |
| Expected Market Value | `460000` |
| Purchase Price | `380000` |
| Purchase Date | `10/03/2010` |
| Tenure/Title | `freehold` |
| Build-up Area (sqft) | `950` |
| Land Area (sqft) | `950` |
| Property Encumbered | `no` |
| Fire Insurance | `notAvailable` |
| Documents | Grant/Title, Sale Agreement, Valuation Report |

### Step 4 — Nominee
| Field | Value |
|---|---|
| Add second nominee? | leave unchecked |
| Nominee 1 Salutation | `Mr` |
| Nominee 1 Name | `Amir Bin Ahmad` |
| Nominee 1 IC | `950214-14-6543` |
| Nominee 1 Address | `12 Jalan Bunga Raya, Taman Melati` |
| Nominee 1 Postcode | `53100` |
| Nominee 1 Email | `amir.ahmad@example.com` |
| Nominee 1 Residence Phone | `03-4021234` |
| Nominee 1 Telephone | `013-2345678` |
| Nominee 1 Race | `Malay` |
| Nominee 1 Marital Status | `Single` |
| Nominee 1 Malaysian (checkbox) | checked |
| Nominee 1 Relationship to Applicant | `Son` |
| Nominee 1 Occupation | `Engineer` |
| Nominee 1 Employer Name | `Petronas` |

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
No input — verify every field above renders correctly, then Submit.

---

## Persona B — Joint applicant + two nominees

### Step 1 — Personal Information
| Field | Value |
|---|---|
| How did you know about SSB | `website` |
| NRIC No. | `681203-08-5432` (auto-fills DOB 03/12/1968, Sex: Female, Citizenship: Malaysian Citizen) |
| Name as per NRIC | `Salmah Binti Yusof` |
| Race | `Malay` |
| Marital Status | `Married` |
| Address | `88 Jalan Anggerik, Taman Orkid` |
| Postcode | `40450` |
| Email | `salmah.yusof@example.com` |
| Residence Phone | `03-5512345` |
| Telephone (mobile) | `019-8765432` |
| Number of Dependents | `1` → Dependent Age 1: `30` |
| Present House Ownership | `mortgaged` |
| Occupation | `Retired Nurse` |
| Employer Name | `N/A - Retired` |
| Employer Address | `N/A` |
| Employer Postcode | `40450` |
| Purpose of Application | `Supplement retirement income and medical costs` |
| Payout Option | `Monthly Payout and Lump Sum` |
| Lump Sum Usage | `Payment for medical expenses` |
| Payment Option | `To be advanced by Organization` |
| Documents | Applicant NRIC, Birth Certificate, 3× Payslips, 6× Bank Statements, EPF Statement |

Joint applicant: check **"Do you have a joint applicant?"**.

### Step 2 — Joint Applicant & Banking
| Field | Value |
|---|---|
| Salutation | `Mr` |
| Name | `Rahman Bin Osman` |
| IC | `620728-14-5951` (age 63, valid) |
| Address | `88 Jalan Anggerik, Taman Orkid` |
| Postcode | `40450` |
| Email | `rahman.osman@example.com` |
| Residence Phone | `03-5512345` |
| Telephone | `017-6543210` |
| Race | `Malay` |
| Marital Status | `Married` |
| Relationship with Applicant | `spouse` |
| Occupation | `Retired Civil Servant` |
| Employer Name | `N/A - Retired` |
| Employer Address | `N/A` |
| Employer Postcode | `40450` |
| Documents | Joint Applicant NRIC |
| Bank Name | `CIMB Bank` |
| Account Type | `joinAccountSaving` *(must be a joint account type when a joint applicant exists)* |
| Account Number | `9988776655443` |
| Account Preference | `islamic` |

### Step 3 — Property Details
| Field | Value |
|---|---|
| Property Type | `terrace` |
| Property Address | `No. 7, Jalan Delima 3, Bandar Baru` |
| Scheme Name | `Bandar Baru Delima` |
| District | `Kuala Selangor` |
| Mukim | `Ijok` |
| Postcode | `45000` |
| Indicative Market Value | `600000` |
| Valuation Date | `15/05/2026` |
| Expected Market Value | `620000` |
| Purchase Price | `500000` |
| Purchase Date | `20/01/2005` |
| Tenure/Title | `leasehold` |
| Lease Expiry Date | `01/01/2140` *(≥ 90 years remaining from today, per the leasehold rule)* |
| Build-up Area (sqft) | `1400` |
| Land Area (sqft) | `1600` |
| Property Encumbered | `yes` → Bank Name: `RHB Bank`, Est. Outstanding Balance: `85000` |
| Fire Insurance | `inForce` → Insurance Company: `Etiqa Insurance`, Period of Validity: `01/01/2026 - 31/12/2026`, upload Fire Insurance doc |
| Documents | Grant/Title, Sale Agreement, Valuation Report, Fire Insurance |

### Step 4 — Nominees
| Field | Nominee 1 | Nominee 2 |
|---|---|---|
| Add second nominee? | — | check the box |
| Salutation | `Mr` | `Ms` |
| Name | `Faizal Bin Rahman` | `Farah Binti Rahman` |
| IC | `970118-14-5439` | `980730-10-4322` |
| Address | `88 Jalan Anggerik, Taman Orkid` | `88 Jalan Anggerik, Taman Orkid` |
| Postcode | `40450` | `40450` |
| Email | `faizal.rahman@example.com` | `farah.rahman@example.com` |
| Residence Phone | `03-5512345` | `03-5512345` |
| Telephone | `013-2345678` | `014-9876543` |
| Race | `Malay` | `Malay` |
| Marital Status | `Single` | `Single` |
| Malaysian (checkbox) | checked | checked |
| Relationship to Applicant | `Son` | `Daughter` |
| Occupation | `Accountant` | `Doctor` |
| Employer Name | `KPMG` | `Hospital Kuala Lumpur` |

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
Verify the joint applicant, second nominee, leasehold/encumbered/fire-insurance conditional fields all
render, then Submit.

---

## Negative-path values (for validation testing)

| Scenario | Value to try | Expected result |
|---|---|---|
| Under-age applicant | NRIC `050101-14-5432` (age ~21) | Blocked: "must be at least 55 years old" |
| PR / foreign-born applicant | NRIC `650515-75-5677` (place-of-birth code 75) | Blocked: "must be a Malaysian citizen... PR are not eligible" |
| Malformed IC | `650515-1-5677` | "IC must be in format: xxxxxx-xx-xxxx" |
| Non-KL property postcode | any 5-digit value not in the postcode dropdown | Dropdown only allows the 13 valid codes, so this can only be tried by tampering with the request |
| Leasehold with < 90 years left | Lease Expiry Date `01/01/2050` | Blocked: remaining lease must be ≥ 90 years |
| Duplicate nominee = applicant | Nominee IC same as applicant's IC | Blocked: duplicate person check |
| Invalid postcode format | Postcode `1234` | "Postcode must be 5 digits" |
| Invalid email | `not-an-email` | "Invalid email format" |
| Bad account number | `12345` (< 8 digits) | "Account Number must contain 8 to 16 digits" |

---

## How these were derived

- **IC numbers** follow the app's own parsing rule (`validateIC` in `applicationValidation.js`): format
  `YYMMDD-PB-####`; century is `2000+YY` if `YY ≤ 25`, else `1900+YY`; place-of-birth code `01–59` = Malaysian
  (`60–99` = PR, rejected for SSB). All applicant/joint-applicant ICs here use `YY` in the 1960s so they land
  in the 1900s century and produce an age ≥ 55 as of 2026-07-08. Nominee ICs use `YY` in the 1990s, giving
  adult but non-elderly ages (no age floor applies to nominees).
- **Property postcodes** must be one of the 13 fixed values in `src/utils/klPostcodes.js`
  (`KL_POSTCODES`) — this is a hardcoded allow-list, not a real KL/Selangor postcode range, so only those
  exact strings will pass.
- **Phone formats**: mobile/telephone must match `^\d{3}-\d{7,8}$`; residence phone (optional) must match
  `^03-\d{7}$` exactly.
- **Documents**: any small file (PDF/JPG/PNG) satisfies the required-upload checks — the validation only
  checks that a document record exists, not its content.
- Every IC number across both personas is distinct, including nominees — `check_duplicate_ic` /
  `check_duplicate_nominee_ic` run across *all* applications in the database, so reusing an IC from a
  prior test run (even for a different role) will be rejected as a duplicate.
- All enum/radio values (`presentHouse`, `payoutOption`, `paymentOption`, `accountType`,
  `accountPreference`, `propertyType`, `tenureTitle`, `propertyEncumbered`, `fireInsurance`, `jRelationship`,
  `howDidYouKnow`) are copied verbatim from the `value="..."` attributes in
  `src/views/ApplicationFormView.jsx`, so the UI will render them as selected once entered/re-loaded.
