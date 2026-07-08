# Application Wizard Test Data

Ready-to-type values for exercising the 7-step SSB application wizard (`ApplicationController` /
`ApplicationFormView`) end-to-end. All values are constructed to pass every rule in
`src/utils/applicationValidation.js` as of 2026-07-08 (IC format/age/PR check, excluded-postcode list,
phone/postcode/email/temp-email regex, 90-year leasehold rule, encumbrance block, etc.) — see "How these
were derived" at the bottom.

Twelve profiles are provided in total:

- **Persona A — Single applicant, single nominee.** Simplest path: `isJointApplicant=false`,
  `hasSecondNominee=false`. Use this first to validate the happy path (AM-06/AM-16 in the testing checklist).
- **Persona B — Joint applicant + two nominees.** Exercises every conditional block (Step 2 joint-applicant
  fields, Step 4 second nominee, lump-sum usage, leasehold expiry, fire insurance).
- **Profiles 3–12** — ten more single- and joint-applicant variations covering every race/marital
  status/present-house/property-type/payout/lump-sum-usage/fire-insurance value and all four joint-applicant
  relationships bar one; see the compact tables further down.

Each applicant/joint-applicant IC is a _valid format_ Malaysian IC (place-of-birth code 01–59, i.e. not a
PR) that resolves to an age ≥ 55 today. Nominee ICs are valid-format Malaysian ICs with no age floor.
None of these numbers are real people's ICs — they are algorithmically constructed test values.

---

## Persona A — Single applicant, single nominee

### Step 1 — Personal Information

| Field                      | Value                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| How did you know about SSB | `family/friends`                                                                                                  |
| NRIC No.                   | `650515-14-5677` (auto-fills DOB 15/05/1965, Sex: Male, Citizenship: Malaysian Citizen)                           |
| Name as per NRIC           | `Ahmad Bin Ismail`                                                                                                |
| Race                       | `Malay`                                                                                                           |
| Marital Status             | `Married`                                                                                                         |
| Address                    | `12 Jalan Bunga Raya, Taman Melati`                                                                               |
| Postcode                   | `53100`                                                                                                           |
| Email                      | `ahmad.ismail@example.com`                                                                                        |
| Residence Phone (optional) | `03-4021234`                                                                                                      |
| Telephone (mobile)         | `012-3456789`                                                                                                     |
| Number of Dependents       | `0`                                                                                                               |
| Present House Ownership    | `own`                                                                                                             |
| Occupation                 | `Retired Teacher`                                                                                                 |
| Employer Name              | `N/A - Retired`                                                                                                   |
| Employer Address           | `N/A`                                                                                                             |
| Employer Postcode          | `53100`                                                                                                           |
| Purpose of Application     | `Supplement retirement income`                                                                                    |
| Payout Option              | `Monthly Payout only`                                                                                             |
| Payment Option             | `To be paid by borrower/customer`                                                                                 |
| Documents                  | Upload any small PDF/image for: Applicant NRIC, Birth Certificate, 3× Payslips, 6× Bank Statements, EPF Statement |

Joint applicant: leave **"Do you have a joint applicant?"** unchecked.

### Step 2 — Banking (no joint applicant)

| Field              | Value           |
| ------------------ | --------------- |
| Bank Name          | `Maybank`       |
| Account Type       | `savings`       |
| Account Number     | `1234567890123` |
| Account Preference | `conventional`  |

### Step 3 — Property Details

| Field                   | Value                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| Property Type           | `high-rise`                                                               |
| Property Address        | `Unit 5-3, Pangsapuri Melati, Jalan Melati 5`                             |
| Scheme Name             | `Pangsapuri Melati`                                                       |
| District                | `Klang`                                                                   |
| Mukim                   | `Kapar`                                                                   |
| Postcode                | `43000` _(must NOT be one of the excluded KL_POSTCODES values — see note below)_ |
| Indicative Market Value | `450000`                                                                  |
| Valuation Date          | `01/06/2026`                                                              |
| Expected Market Value   | `460000`                                                                  |
| Purchase Price          | `380000`                                                                  |
| Purchase Date           | `10/03/2010`                                                              |
| Tenure/Title            | `freehold`                                                                |
| Build-up Area (sqm)     | `950`                                                                     |
| Land Area (sqm)         | `950`                                                                     |
| Property Encumbered     | `no`                                                                      |
| Fire Insurance          | `notAvailable`                                                            |
| Fire Insurance Renewal  | `cagamasRenew`                                                            |
| Documents               | Grant/Title, Sale Agreement, Valuation Report                             |

### Step 4 — Nominee

| Field                               | Value                               |
| ----------------------------------- | ----------------------------------- |
| Add second nominee?                 | leave unchecked                     |
| Nominee 1 Salutation                | `Mr`                                |
| Nominee 1 Name                      | `Amir Bin Ahmad`                    |
| Nominee 1 IC                        | `950214-14-6543`                    |
| Nominee 1 Address                   | `12 Jalan Bunga Raya, Taman Melati` |
| Nominee 1 Postcode                  | `53100`                             |
| Nominee 1 Email                     | `amir.ahmad@example.com`            |
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

No input — verify every field above renders correctly, then Submit.

---

## Persona B — Joint applicant + two nominees

### Step 1 — Personal Information

| Field                      | Value                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| How did you know about SSB | `website`                                                                                 |
| NRIC No.                   | `681203-08-5432` (auto-fills DOB 03/12/1968, Sex: Female, Citizenship: Malaysian Citizen) |
| Name as per NRIC           | `Salmah Binti Yusof`                                                                      |
| Race                       | `Malay`                                                                                   |
| Marital Status             | `Married`                                                                                 |
| Address                    | `88 Jalan Anggerik, Taman Orkid`                                                          |
| Postcode                   | `40450`                                                                                   |
| Email                      | `salmah.yusof@example.com`                                                                |
| Residence Phone            | `03-5512345`                                                                              |
| Telephone (mobile)         | `019-8765432`                                                                             |
| Number of Dependents       | `1` → Dependent Age 1: `30`                                                               |
| Present House Ownership    | `mortgaged`                                                                               |
| Occupation                 | `Retired Nurse`                                                                           |
| Employer Name              | `N/A - Retired`                                                                           |
| Employer Address           | `N/A`                                                                                     |
| Employer Postcode          | `40450`                                                                                   |
| Purpose of Application     | `Supplement retirement income and medical costs`                                          |
| Payout Option              | `Monthly Payout and Lump Sum`                                                             |
| Lump Sum Usage             | `Payment for medical expenses`                                                            |
| Payment Option             | `To be advanced by Organization`                                                          |
| Documents                  | Applicant NRIC, Birth Certificate, 3× Payslips, 6× Bank Statements, EPF Statement         |

Joint applicant: check **"Do you have a joint applicant?"**.

### Step 2 — Joint Applicant & Banking

| Field                       | Value                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Salutation                  | `Mr`                                                                               |
| Name                        | `Rahman Bin Osman`                                                                 |
| IC                          | `620728-14-5951` (age 63, valid)                                                   |
| Address                     | `88 Jalan Anggerik, Taman Orkid`                                                   |
| Postcode                    | `40450`                                                                            |
| Email                       | `rahman.osman@example.com`                                                         |
| Residence Phone             | `03-5512345`                                                                       |
| Telephone                   | `017-6543210`                                                                      |
| Race                        | `Malay`                                                                            |
| Marital Status              | `Married`                                                                          |
| Relationship with Applicant | `spouse`                                                                           |
| Occupation                  | `Retired Civil Servant`                                                            |
| Employer Name               | `N/A - Retired`                                                                    |
| Employer Address            | `N/A`                                                                              |
| Employer Postcode           | `40450`                                                                            |
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
| Postcode                | `43200` _(must NOT be one of the excluded KL_POSTCODES values — see note below)_                                          |
| Indicative Market Value | `600000`                                                                                                                   |
| Valuation Date          | `15/05/2026`                                                                                                               |
| Expected Market Value   | `620000`                                                                                                                   |
| Purchase Price          | `500000`                                                                                                                   |
| Purchase Date           | `20/01/2005`                                                                                                               |
| Tenure/Title            | `leasehold`                                                                                                                |
| Lease Expiry Date       | `01/01/2140` _(≥ 90 years remaining from today, per the leasehold rule)_                                                   |
| Build-up Area (sqm)     | `1400`                                                                                                                     |
| Land Area (sqm)         | `1600`                                                                                                                     |
| Property Encumbered     | `no` _(SSB now hard-blocks submission if `yes` — see note below)_                                                         |
| Fire Insurance          | `inForce` → Insurance Company: `Etiqa Insurance`, Period of Validity: `01/01/2026 - 31/12/2026`, upload Fire Insurance doc |
| Fire Insurance Renewal  | `selfRenewal`                                                                                                             |
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
| Email                     | `faizal.rahman@example.com`      | `farah.rahman@example.com`       |
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

## Profiles 3–12 — additional applicants (compact reference)

Ten more ready-to-type applicants, numbered on from Persona A (1) and B (2). Each is independently valid
against every check in `applicationValidation.js` as of 2026-07-08 — distinct ICs (no duplicates across
this whole document), applicant/joint-applicant age ≥ 55, non-excluded property postcode,
`propertyEncumbered: no`, and a `renewalFireInsurance` selection. Profiles 5, 7 and 10 have a joint
applicant; all others are single-applicant. Step 5 (signature name/date = applicant's own name/today) and
Step 6 (acknowledgement fields copied verbatim from Steps 1/4) follow the same pattern as Persona A/B and
aren't repeated per-row. For every profile, Step 1 documents = Applicant NRIC + Birth Certificate + 3
Payslips + 6 Bank Statements + EPF Statement; Step 3 documents = Grant/Title + Sale Agreement + Valuation
Report (+ Fire Insurance doc when `fireInsurance: inForce`); Step 4 documents = 1 doc per nominee (NRIC).

### Applicant identity & contact

| # | Name | NRIC (age/sex) | Race | Marital | Address / Postcode | Email | Telephone | Residence Phone | Dependents | Present House |
|---|------|-----------------|------|---------|---------------------|-------|-----------|------------------|------------|----------------|
| 3 | Zulkifli Bin Hassan | `600110-08-5433` (66, M) | Malay | Married | 21 Jalan Meranti, Taman Meranti / `47301` | zulkifli.hassan@example.com | `012-3344556` | `03-7891234` | 0 | own |
| 4 | Lee Mei Ling | `620825-10-6242` (63, F) | Chinese | Widowed | 9 Jalan Cempaka, Taman Cempaka / `68100` | meiling.lee@example.com | `013-5566778` | `03-6291234` | 2 (ages 35, 32) | family |
| 5 | Suresh A/L Muthu | `580317-05-5461` (68, M) | Indian | Married | 5 Jalan Anggerik, Taman Seri Anggerik / `70200` | suresh.muthu@example.com | `019-2233445` | `03-2091234` | 0 | own |
| 6 | Rosli Bin Kassim | `570622-02-5715` (69, M) | Malay | Divorced | 18 Jalan Sena, Taman Sena / `05000` | rosli.kassim@example.com | `011-23445566` | `03-7423456` | 1 (age 40) | family |
| 7 | Balasubramaniam A/L Rajoo | `590214-12-5637` (67, M) | Other | Single | 6 Jalan Tanjung, Taman Tanjung / `88300` | bala.rajoo@example.com | `016-7788990` | `03-8891234` | 0 | mortgaged |
| 8 | Kavitha A/P Ramasamy | `650430-01-5648` (61, F) | Indian | Married | 14 Jalan Seroja, Taman Seroja / `80100` | kavitha.ramasamy@example.com | `018-2233445` | `03-7123456` | 0 | own |
| 9 | Tan Ah Kow | `590911-07-5539` (66, M) | Chinese | Widowed | 3 Lorong Timah, Taman Timah / `11700` | tan.ahkow@example.com | `012-8899001` | `03-4045678` | 0 | rented |
| 10 | Zainab Binti Omar | `600505-14-5462` (66, F) | Malay | Married | 10 Jalan Mawar, Taman Mawar / `56000` | zainab.omar@example.com | `019-3344556` | `03-9123456` | 0 | own |
| 11 | Jimmy Anak Belaga | `610703-13-5511` (65, M) | Other | Married | 4 Jalan Satok, Taman Satok / `93350` | jimmy.belaga@example.com | `013-8899001` | `03-4823456` | 0 | family |
| 12 | Norhayati Binti Rahim | `630228-09-5628` (63, F) | Malay | Single | 7 Jalan Kangar, Taman Kangar / `01000` | norhayati.rahim@example.com | `014-9900112` | `03-5723456` | 0 | mortgaged |

### Employment, purpose & banking

| # | Occupation | Employer (Name / Postcode) | Purpose | Payout Option (+ Lump Sum Usage) | Payment Option | How did you know | Bank / Account Type / Account No. / Preference |
|---|-----------|------------------------------|---------|-----------------------------------|-----------------|-------------------|--------------------------------------------------|
| 3 | Retired Clerk | N/A - Retired / `47301` | Supplement retirement income | `monthlyPayout` | `toBePaid` | google | Public Bank / `savings` / `2233445566` / conventional |
| 4 | Retired Accountant | N/A - Retired / `68100` | Supplement retirement income and medical costs | `monthlyPayout_lumpSum` → `medicalExpenses` | `toBePaid` | social_media | Hong Leong Bank / `savings` / `3344556677889` / conventional |
| 5 | Retired Estate Manager | N/A - Retired / `70200` | Supplement retirement income | `monthlyPayout` | `toBePaid` | expo | Bank Rakyat / `joinAccountSaving` / `4455667788` / islamic |
| 6 | Retired Businessman | N/A - Retired / `05000` | Supplement retirement income and settle outstanding debts | `monthlyPayout_lumpSum` → `settleOutstandingMortgage` | `toBeAdvanced` | tv/radio/newspaper | Bank Islam / `savings` / `55667788` / islamic |
| 7 | Retired Surveyor | N/A - Retired / `88300` | Supplement retirement income | `monthlyPayout` | `toBePaid` | website | Standard Chartered / `joinAccountSaving` / `6677889900` / conventional |
| 8 | Retired Bank Officer | N/A - Retired / `80100` | Supplement retirement income | `monthlyPayout` | `toBePaid` | family/friends | OCBC Bank / `savings` / `778899001122` / conventional |
| 9 | Retired Fisherman | N/A - Retired / `11700` | Supplement retirement income for home refurbishment | `monthlyPayout_lumpSum` → `maintenance` | `toBePaid` | google | Affin Bank / `savings` / `99001122` / conventional |
| 10 | Retired School Principal | N/A - Retired / `56000` | Supplement retirement income | `monthlyPayout` | `toBePaid` | expo | Alliance Bank / `jointAccountCurrent` / `8899001122` / islamic |
| 11 | Retired Forest Ranger | N/A - Retired / `93350` | Supplement retirement income | `monthlyPayout` | `toBePaid` | social_media | Maybank / `savings` / `11223344` / conventional |
| 12 | Retired Librarian | N/A - Retired / `01000` | Supplement retirement income and medical costs | `monthlyPayout_lumpSum` → `medicalExpenses` | `toBeAdvanced` | tv/radio/newspaper | CIMB Bank / `savings` / `2200334455` / islamic |

Employer Address = `N/A` and Employer Postcode = same postcode shown above, for all 10 profiles.

### Joint applicants (Profiles 5, 7, 10 only)

| # | Salutation | Name | NRIC (age/sex) | Email | Telephone | Race | Marital | Relationship | Occupation |
|---|-----------|------|-----------------|-------|-----------|------|---------|---------------|------------|
| 5 | Mdm | Kamala A/P Krishnan | `600925-05-5522` (65, F) | kamala.krishnan@example.com | `012-6677889` | Indian | Married | `spouse` | Retired Nurse |
| 7 | Ms | Vasanthi A/P Rajoo | `610730-12-5748` (64, F) | vasanthi.rajoo@example.com | `017-9900112` | Other | Single | `siblings` | Retired Clerk |
| 10 | Dato' | Ismail Bin Ahmad | `400118-14-5211` (86, M) | ismail.ahmad@example.com | `012-4455667` | Malay | Widowed | `parent` | Retired Government Servant |

Joint applicant's Address/Postcode/Residence Phone/Employer Address/Employer Postcode = same as the
applicant's in the table above; Employer Name = `N/A - Retired`. Account type for these three profiles is
already the required joint type (see banking table above).

### Property details

| # | Type | Address / Scheme / District / Mukim | Postcode | Market Value → Expected | Purchase Price / Date | Tenure (Expiry if leasehold) | Build-up / Land (sqm) | Fire Insurance | Renewal |
|---|------|----------------------------------------|----------|--------------------------|-------------------------|-------------------------------|-------------------------|-----------------|---------|
| 3 | `terrace` | No. 15, Jalan Damai 2, Bandar Damai / Bandar Damai / Petaling / Damansara | `47301` | 380000 → 390000 | 250000 / 12/08/2001 | `freehold` | 1200 / 1400 | `notAvailable` | `cagamasRenew` |
| 4 | `high-rise` | Unit 12-2, Kondominium Cempaka, Jalan Cempaka 3 / Kondominium Cempaka / Gombak / Batu | `68100` | 320000 → 330000 | 200000 / 15/11/2008 | `leasehold` (`01/01/2135`) | 900 / 900 | `inForce` → Allianz Malaysia, `01/01/2026 - 31/12/2026` | `selfRenewal` |
| 5 | `semi-detach` | No. 3, Jalan Seri Anggerik 2, Taman Seri Anggerik / Taman Seri Anggerik / Seremban / Seremban | `70200` | 550000 → 560000 | 400000 / 05/07/1998 | `freehold` | 1800 / 2400 | `notAvailable` | `cagamasRenew` |
| 6 | `detach` | No. 22, Jalan Bukit Indah, Taman Bukit Indah / Taman Bukit Indah / Kota Setar / Alor Setar | `05000` | 700000 → 720000 | 480000 / 03/09/1995 | `freehold` | 2500 / 3200 | `inForce` → Great Eastern, `01/02/2026 - 31/01/2027` | `selfRenewal` |
| 7 | `others` | No. 8, Jalan Tanjung Aru, Taman Tanjung / Taman Tanjung / Kota Kinabalu / Kota Kinabalu | `88300` | 480000 → 495000 | 320000 / 18/06/2002 | `leasehold` (`01/06/2130`) | 1600 / 1600 | `notAvailable` | `cagamasRenew` |
| 8 | `terrace` | No. 27, Jalan Seroja 5, Taman Seroja / Taman Seroja / Johor Bahru / Plentong | `80100` | 410000 → 420000 | 280000 / 25/02/2006 | `freehold` | 1300 / 1500 | `inForce` → Tokio Marine, `01/03/2026 - 28/02/2027` | `selfRenewal` |
| 9 | `high-rise` | Unit 8-1, Pangsapuri Timah, Jalan Timah 2 / Pangsapuri Timah / Timur Laut / George Town | `11700` | 350000 → 360000 | 220000 / 14/12/2010 | `freehold` | 850 / 850 | `notAvailable` | `cagamasRenew` |
| 10 | `semi-detach` | No. 19, Jalan Mawar 3, Taman Mawar / Taman Mawar / Hulu Langat / Cheras | `56000` | 650000 → 670000 | 500000 / 09/10/1999 | `leasehold` (`01/09/2125`) | 2000 / 2600 | `inForce` → AIA Malaysia, `01/04/2026 - 31/03/2027` | `selfRenewal` |
| 11 | `bungalow` | No. 6, Jalan Stutong, Taman Stutong / Taman Stutong / Kuching / Kuching | `93350` | 590000 → 600000 | 420000 / 30/03/2004 | `freehold` | 2100 / 2800 | `notAvailable` | `cagamasRenew` |
| 12 | `terrace` | No. 11, Jalan Kangar 4, Taman Kangar / Taman Kangar / Perlis / Kangar | `01000` | 300000 → 310000 | 190000 / 22/09/2009 | `leasehold` (`01/01/2140`) | 1100 / 1300 | `inForce` → Zurich Malaysia, `01/05/2026 - 30/04/2027` | `selfRenewal` |

Valuation Date = `10/06/2026` for all 10 profiles. `propertyEncumbered` = `no` for all 10 (required — see
"How these were derived").

### Nominees

| # | Nom. | Salutation | Name | NRIC (age/sex) | Address/Postcode | Email | Telephone | Res. Phone | Race | Marital | Relationship | Occupation / Employer |
|---|------|-----------|------|-----------------|--------------------|-------|-----------|------------|------|---------|---------------|-------------------------|
| 3 | 1 | Mr | Hafiz Bin Zulkifli | `990325-08-5147` (27, M) | same as applicant / `47301` | hafiz.zulkifli@example.com | `016-2233445` | `03-7891234` | Malay | Single | Son | Technician / Perodua |
| 4 | 1 | Mr | Kevin Lee Wei Jian | `950612-10-6351` (31, M) | same as applicant / `68100` | kevin.lee@example.com | `017-8899001` | `03-6291234` | Chinese | Single | Son | Software Engineer / Shopee |
| 4 | 2 | Ms | Grace Lee Wei Xin | `980204-10-6524` (28, F) | same as applicant / `68100` | grace.lee@example.com | `018-7766554` | `03-6291234` | Chinese | Single | Daughter | Pharmacist / Guardian Health |
| 5 | 1 | Mr | Ravi A/L Suresh | `921115-05-5673` (33, M) | same as applicant / `70200` | ravi.suresh@example.com | `014-3322110` | `03-2091234` | Indian | Single | Son | Lawyer / Zul Rafique & Partners |
| 6 | 1 | Mr | Amirul Bin Rosli | `940508-02-5219` (32, M) | same as applicant / `05000` | amirul.rosli@example.com | `019-4455667` | `03-7423456` | Malay | Married | Son | Pilot / AirAsia |
| 6 | 2 | Ms | Aina Binti Rosli | `970812-02-5324` (28, F) | same as applicant / `05000` | aina.rosli@example.com | `013-5566779` | `03-7423456` | Malay | Single | Daughter | Teacher / SMK Alor Setar |
| 7 | 1 | Mr | Suresh A/L Bala | `960217-12-5835` (30, M) | same as applicant / `88300` | suresh.bala@example.com | `012-3344559` | `03-8891234` | Other | Single | Son | Marine Engineer / Sabah Ports |
| 8 | 1 | Mr | Dinesh A/L Ramasamy | `930615-01-5761` (33, M) | same as applicant / `80100` | dinesh.ramasamy@example.com | `014-5566778` | `03-7123456` | Indian | Single | Son | Civil Engineer / Gamuda |
| 8 | 2 | Ms | Priya A/P Ramasamy | `960920-01-5844` (29, F) | same as applicant / `80100` | priya.ramasamy@example.com | `016-6677889` | `03-7123456` | Indian | Single | Daughter | Pharmacist / Caring Pharmacy |
| 9 | 1 | Mr | Tan Wei Ming | `990403-07-5143` (27, M) | same as applicant / `11700` | tan.weiming@example.com | `017-2233445` | `03-4045678` | Chinese | Single | Son | Chef / Shangri-La Hotel |
| 10 | 1 | Mr | Hafizuddin Bin Yusof | `920815-14-5327` (33, M) | same as applicant / `56000` | hafizuddin.yusof@example.com | `013-6677889` | `03-9123456` | Malay | Married | Son | Architect / Jabatan Kerja Raya |
| 10 | 2 | Ms | Aisyah Binti Yusof | `950127-14-5468` (31, F) | same as applicant / `56000` | aisyah.yusof@example.com | `014-7788990` | `03-9123456` | Malay | Single | Daughter | Pharmacist / Hospital Kuala Lumpur |
| 11 | 1 | Mr | Ricky Anak Jimmy | `950511-13-5623` (31, M) | same as applicant / `93350` | ricky.jimmy@example.com | `017-3344556` | `03-4823456` | Other | Single | Son | Park Ranger / Sarawak Forestry |
| 12 | 1 | Ms | Aminah Binti Rahim | `650815-09-5762` (60, F) | same as applicant / `01000` | aminah.rahim@example.com | `016-8899001` | `03-5723456` | Malay | Married | Sister | Nurse / Hospital Kangar |
| 12 | 2 | Mr | Farid Bin Ahmad | `990410-09-5837` (27, M) | same as applicant / `01000` | farid.ahmad@example.com | `019-9900112` | `03-5723456` | Malay | Single | Nephew | Mechanic / Proton |

"Malaysian" checkbox = checked for every nominee. Profiles 3, 5, 7, 9 and 11 have one nominee; the rest
have two (check "Add second nominee?" for those).

---

## Negative-path values (for validation testing)

| Scenario                       | Value to try                                   | Expected result                                                                                  |
| ------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Under-age applicant            | NRIC `050101-14-5432` (age ~21)                | Blocked: "must be at least 55 years old"                                                         |
| PR / foreign-born applicant    | NRIC `650515-75-5677` (place-of-birth code 75) | Blocked: "must be a Malaysian citizen... PR are not eligible"                                    |
| Malformed IC                   | `650515-1-5677`                                | "IC must be in format: xxxxxx-xx-xxxx"                                                           |
| Excluded property postcode     | Property Postcode `41100` (or any of the 13 excluded values) | Blocked: "This postcode is excluded from eligibility"                                            |
| Leasehold with < 90 years left | Lease Expiry Date `01/01/2050`                 | Blocked: remaining lease must be ≥ 90 years                                                      |
| Encumbered property            | Property Encumbered `yes`                      | Blocked: "Property must be free from encumbrances... requirement for SSB eligibility"            |
| Duplicate nominee = applicant  | Nominee IC same as applicant's IC              | Blocked: duplicate person check                                                                  |
| Invalid postcode format        | Postcode `1234`                                | "Postcode must be 5 digits"                                                                      |
| Invalid email                  | `not-an-email`                                 | "Invalid email format"                                                                           |
| Temporary/disposable email     | `user@mailinator.com`                          | "Temporary email addresses are not allowed"                                                      |
| Bad account number             | `12345` (< 8 digits)                           | "Account Number must contain 8 to 16 digits"                                                     |

---

## How these were derived

- **IC numbers** follow the app's own parsing rule (`validateIC` in `applicationValidation.js`): format
  `YYMMDD-PB-####`; century is `2000+YY` if `YY ≤ 25`, else `1900+YY`; place-of-birth code `01–59` = Malaysian
  (`60–99` = PR, rejected for SSB). All applicant/joint-applicant ICs here use `YY` in the 1960s so they land
  in the 1900s century and produce an age ≥ 55 as of 2026-07-08. Nominee ICs use `YY` in the 1990s, giving
  adult but non-elderly ages (no age floor applies to nominees).
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
  `mailinator.com`, `yopmail.com` — `example.com` is safe and used throughout.
- **Bank Name** is a dropdown of `src/utils/malaysianBanks.js` (`MALAYSIAN_BANKS`); typing a name under
  "Other" that closely matches a listed bank is rejected and redirected to the dropdown entry.
- **Documents**: any small file (PDF/JPG/PNG) satisfies the required-upload checks — the validation only
  checks that a document record exists, not its content.
- Every IC number across every profile in this document is distinct, including nominees —
  `check_duplicate_ic` / `check_duplicate_nominee_ic` run across _all_ applications in the database, so
  reusing an IC from a prior test run (even for a different role) will be rejected as a duplicate.
- All enum/radio values (`presentHouse`, `payoutOption`, `paymentOption`, `accountType`,
  `accountPreference`, `propertyType`, `tenureTitle`, `propertyEncumbered`, `fireInsurance`, `jRelationship`,
  `howDidYouKnow`) are copied verbatim from the `value="..."` attributes in
  `src/views/ApplicationFormView.jsx`, so the UI will render them as selected once entered/re-loaded.
