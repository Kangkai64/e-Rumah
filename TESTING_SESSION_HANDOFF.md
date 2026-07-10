# Testing Session Handoff — e-Rumah Verification Checklist

**Last session:** 2026-07-09 (session 6 — code-verified the remaining "Not Tested" rows across the checklist that hadn't been touched by any prior session: 32 items across Health Monitoring, Application Management, and Customer Support, via three parallel sub-agents. Six checklist items (NF-01–04 timing, NF-06 WCAG contrast, NF-14 cross-browser) genuinely require live tools/browsers and were left untouched; NF-13 (elderly-friendly usability/touch targets) was checked but also needs a live visual pass and stays "Not Tested". All 33 rows (32 verdicts + NF-13's remark) were written into `e-Rumah_Testing_Verification_Checklist.xlsx`.)

### Session 6 summary
One real bug found and fixed: `HealthReportController.jsx`'s report-fetch options computed `showArchived: activeTab === 'archived' && userRole !== 'admin'` — for an admin, `userRole !== 'admin'` is always false, so the expression was always false regardless of which tab was active, meaning admins' base report fetch *always* excluded archived reports from the query. Clicking the Archived tab then had nothing to client-side-filter down to, so **an admin's Archived tab was permanently empty**, while the same tab worked fine for regular users. Fixed by dropping the role condition (`showArchived: activeTab === 'archived'`) so both roles behave the same way. `npm run build` passes; the file's pre-existing 13 lint issues (unused-var/hook-dependency noise) are unchanged — confirmed via `git stash` that they predate this session entirely.

One further gap identified but deliberately **not** fixed: HM-18 expects a per-row due-date badge (Overdue/Due Soon/Up to Date), but the results table's badge always renders `health_report_status` (Pending/Reviewed/Flagged/Archived) — `due_status` never reaches the badge, and `StatusBadge`'s `getStatusClass` has no CSS classes for the due-date states at all. This is a UI/design decision (new column + new badge styling), not a one-line correctness bug, so it's left as a documented follow-up rather than building new UI unasked.

**New Fail/gap findings worth flagging for a product decision** (all code-verified, none fixed this session — same reasoning as HM-18, these are feature/scope decisions):
- **AM-01**: the wizard has no "select lending organisation" step at all — it's hardcoded to a single generic placeholder, and step titles don't match the spec's description.
- **AM-05**: "unsupported property type" isn't actually a disqualifying condition (property type is a free choice with no eligibility logic attached).
- **AM-07**: the Maintain Application page has zero personal-details/property-details edit capability — only document re-upload, termination request, and nominee-edit are supported.
- **AM-12**: nominee property redemption is entirely unimplemented — no code path exists for a nominee to create a linked redemption application.
- **CS-02**: no guided tutorial/walkthrough exists for the wizard or health-report upload (the closest content describes an offline legacy process that contradicts the actual online wizard).
- **CS-04**: "operating hours" has no field anywhere — only phone/email are implemented in the contact-info system.
- **CS-05**: only the flagged-document alert is real; there's no genuine deadline-approaching push/alert (only a passive reminder-list countdown), and `Notification.js` is confirmed an empty stub.
- **CS-10**: no compose/broadcast capability exists for staff to proactively message an elder or group.
- **CS-12**: staff can flag an application with a reason, but nothing in the admin controllers/views ever reads `is_flagged`/`flagged_reason` — the flag never surfaces to the administrator (distinct from the already-documented AD-08 nominee-approve/reject gap).
- **CS-13**: flagged health reports do reach the support queue, but the actual flag reason is never rendered in the UI (only a generic "notes" field shows).
- **CS-14**: the staff-dashboard search box is dead code — `handleSearch`/`searchTerm` are passed as props but never wired to an input element, so search silently does nothing despite `Inquiry.search()` existing in the model.
- **HM-01**: image uploads (JPG/PNG/WEBP) are never stored natively — they're always converted to PDF first via a `window.confirm`, and declining aborts the upload.
- **HM-06/HM-14**: neither the user nor admin sort dropdown offers "provider" or "due date" as sort fields; admin search is additionally missing `provider_name` entirely.

`npm run build` passes cleanly after the HM-16 fix. Nothing new is committed — still sitting in the working tree alongside sessions 4-5's uncommitted work.

---

**Previous session:** 2026-07-09 (session 5 — regression pass over the full combined working tree after session 4's fix. Five parallel sub-agents each re-traced a specific set of previously-PASSING/fixed test IDs against the current combined code, specifically hunting for interaction bugs between session 4's changes and earlier fixes sitting in the same files: (1) `LoanDisbursement.js`/`LoanDisbursementController.jsx` full file — UM-09, UM-12, UM-13 round-trip; (2) `AuthContext.jsx` interaction with the AM-08/UM-11 nominee-edit gate and UM-04/NF-10; (3) `Admin.js`/`AdminController.jsx`/`AdminReportController.jsx` combined — AD-03/05/06/07/09/10/11, plus an explicit check for the corrupted-comment-block failure mode seen before in `Application.js`; (4) `ApplicationController.jsx`/`ApplicationFormView.jsx`/`applicationValidation.js`/`fileUploadService.js` combined — AM-02/06/15/16 plus session-3's WEBP/PDF-validation interaction; (5) `HealthReportController.jsx`/`HealthMonitoringView.jsx` plus a scope check confirming Customer Support had zero code changes this batch.)

### Session 5 summary
**All five regression checks passed clean — no interaction bugs found** from combining session 4's changes with earlier fixes. Notably: AM-08/UM-11's nominee-edit gate turned out not to depend on `AuthContext` at all (`ApplicationController.jsx` re-derives `applicationStatus` fresh from the DB on every mount of the edit-nominees route), so it's immune to `AuthContext`'s new `SIGNED_IN`-dedup logic — a real question worth asking, resolved as a non-issue. `Admin.js` (1005 lines, several new dashboard-stat functions added) has no duplicate method names or corrupted blocks. The application wizard's new employer-N/A/joint-sync code is a clean, self-contained addition that doesn't touch the autosave debounce, PDF field-mapping, or duplicate-IC validation control flow.

**One small fix applied**, found while regression-testing my own session-4 fix: `LoanDisbursementController.jsx`'s `handleCreateDisbursement` only called `loadPendingSchedules()` in the success branch, so a **failed** confirm (e.g. the race "loser" gets `"already resolved"` back from another admin/tab beating them to it) left the stale, already-resolved schedule row visible in the pending list until a manual reload. Fixed by refreshing the pending list in the catch branch too when `activeScheduleId` was set.

**Known limitation documented, not fixed (rare double-failure edge case):** if `confirmScheduledDisbursement`'s transaction-creation step fails AND the subsequent rollback-to-`pending` update *also* fails (e.g. two independent network blips), the schedule row is left permanently stuck at `status:'confirmed'` with no `transaction_id` — invisible to `getPendingSchedules` forever, never appearing in transaction history either. The admin sees an error at the time, but nothing currently detects/surfaces the stuck row afterward. Left as a follow-up (e.g. an admin query for `confirmed` schedules with a null `transaction_id`) rather than building new admin tooling in a regression pass — flag if this comes up in a live run.

`npm run build` and lint pass after the additional fix.

---

**Previous session:** 2026-07-09 (session 4 — code-verified a new uncommitted batch that landed on top of the session-3 work, which itself got committed as `ee5fa23` between sessions. Four parallel sub-agents covered: (1) loan disbursement automation — new `loan_disbursement_schedules` table + pg_cron auto-scheduling + admin confirm/skip UI + email notifier edge function; (2) admin dashboard stat-accuracy fixes (`reports.created_at`, `applications.rejected_at`) plus new pending-applications filter/quick-stat UI; (3) application wizard UX (employer N/A field hiding, joint-applicant address/marital-status sync, PDF-upload structural validation); (4) `AuthContext.jsx` de-dupe of redundant `SIGNED_IN` refetches plus two small display-field fixes. Also live-smoke-tested the freshly retrained ML model artifact (`xgb_erumah_20260709_1256.pkl`, now the `latest` symlink-equivalent) via `/health` and `/estimate` — works, reports `model_version: XGBoost_20260709_1256` correctly.)

### Session 4 summary
One confirmed, fixed bug: `LoanDisbursement.confirmScheduledDisbursement` (`src/models/LoanDisbursement.js`) checked a schedule row's `status === "pending"` in a separate read *before* creating the real `transactions` row, then flipped it to `confirmed` only afterward with no status guard on that final UPDATE. Two concurrent confirms (double-click, two admin tabs/reload mid-flow) could both pass the check and both insert a payout transaction for the same schedule slot — a real double-disbursement risk. **Fixed** by claiming the row atomically first (`UPDATE ... SET status='confirmed' WHERE id=? AND status='pending'` via Supabase `.update().eq("status","pending").select()`), bailing out if no row comes back, and rolling the claim back to `pending` if the subsequent transaction creation fails.

Everything else in this batch (application wizard UX, AuthContext dedup, admin dashboard stat fixes) checked out clean — no bugs found. One notable non-regression finding: the `revoke-share-proxy` edge function's allowlist previously had **no `reports` entry at all**, so re-viewing/regenerating an existing report was already silently failing with a 403 before this session's changes; this batch's 5-line diff to that function incidentally fixes it by adding the missing allowlist entry (still needs a live edge-function redeploy — source files here aren't auto-deployed).

Feature-gap status update: **UM-13** ("no edit of an existing disbursement record") is now *partially* addressed — pending auto-generated schedule slots can be reviewed/confirmed/skipped — but editing an already-confirmed/manual disbursement transaction is still not implemented. **AM-13** (no notification on application status change) remains a genuine gap; the new notifier is a *different* thing — it emails admins about pending payout confirmations, not applicants about status changes.

`npm run build` passes cleanly after the fix. Still nothing in this repo is committed from session 2 onward except what already landed in `ee5fa23`/`b80a9ac`/`5c5c4e1`/`b6a0831` — this session's changes (loan disbursement automation, admin stats, wizard UX, AuthContext, plus my one-file bug fix) are all still uncommitted in the working tree.

**Still needs a live pass:** pg_cron/pg_net enablement + vault secrets for the two new migration-021 cron jobs (mirrors migration 018's still-outstanding live setup); a live two-tab/double-click test of the disbursement-confirm race now that it's fixed; the `revoke-share-proxy` edge function redeploy; visual confirmation of the new admin dashboard "Days Waiting"/pending-filter UI and the corrected stat cards against real data; the wizard's employer-N/A and joint-applicant-sync UX; all the items already queued from sessions 1-3 below.

---

**Previous session:** 2026-07-08 (session 3 — code-verified the batch of work that landed between sessions 2 and 3: Toast notifications, KL postcode/eligibility logic flip, salutation/gender consistency, bank-name dropdown, WEBP support, drag-and-drop uploads, disabled-reminders UI, and the new reminder/health-report automation migrations+edge functions. No browser-automation tool is available in this environment, so "testing" here is the same code-tracing approach as sessions 1-2, not live clicking — live UI passes are still needed from a human.).

### Session 3 summary
A large batch of uncommitted work (not covered by the session-2 write-up below) had accumulated on top of commits `b6a0831`/`5c5c4e1`/`b80a9ac`: WEBP file-type support end-to-end, a KL-postcode eligibility logic flip (the field was a restrictive dropdown of 13 postcodes labelled "must be in this list"; it's now a free-text postcode validated against the same 13 as an **exclusion** list — this matches `applicationValidation.js`'s actual check, which was already `!KL_POSTCODES.includes(...)` semantics before this session, so the code behavior didn't change, only the mislabeled UI/comments), salutation auto-clear when IC-derived sex no longer matches (`isSalutationCompatibleWithSex` in `icParser.js`), a bank-name dropdown (`malaysianBanks.js`) with "Other" free-text + duplicate-detection, `<input type="date">` pickers replacing the old DD/MM/YYYY triple-select, a disabled-reminders collapsible section with re-enable toggle, and a new automation layer for reminders/health-report status (migrations 018/019 + `archive-old-health-reports`... wait, see fix below).

Traced all of it against the schema and call sites; found the code internally consistent with one exception:

**Fix (session 3):** two new edge functions, `archive-old-health-reports` and `archive-old-health-reports-schedule`, both wrapped `archive_old_health_reports()` behind an HTTP endpoint — but migration 018's actual cron job (`archive-old-health-reports-daily`) calls `select public.archive_old_health_reports();` directly as SQL, and nothing in the frontend invoked either edge function. Both were dead code. Deleted both directories; the SQL-direct cron path is the one that actually runs.

`npm run build` still passes cleanly after the deletion.

**Still needs a live pass** (all of it code-verified only, not clicked through): WEBP upload end-to-end (both single-file `HealthReport.uploadHealthReport` path and multi-file wizard/health-report paths), the postcode field now accepting free text instead of a dropdown (confirm the 13-postcode exclusion message reads correctly and a non-excluded 5-digit KL postcode passes), salutation auto-clear + toast on IC edit, bank "Other" duplicate-match message, the new `<input type="date">` pickers (browser-native calendar UI, min/max bounds), disabled-reminders toggle round-trip, and — most importantly — the pg_cron automation itself (migration 018 requires manually enabling `pg_cron`/`pg_net` and filling in vault secrets in the Supabase dashboard; nothing here confirms the cron jobs actually fire in the live project).

---

**Previous session:** 2026-07-06 (session 2 — completed the code-verification sweep of all remaining modules).
**Goal:** Execute the "e-Rumah Testing and Verification Checklist" Google Sheet (101 test items, 7 module sheets), fix all bugs found, then fill in Pass/Fail statuses.
**Checklist spreadsheet:** Google Drive fileId `1WHmVKzM5BE71fQfbV03UGde4I9-IuYcY` (read via the Google Drive MCP tool `read_file_content`).

All fixes below are **uncommitted** in the working tree. Statuses/remarks/dates have been written into the **local copy** `e-Rumah_Testing_Verification_Checklist.xlsx` (repo root) — 62 of 101 rows filled on 2026-07-06; the other 39 remain "Not Tested" pending live UI runs. The Google Sheet itself is untouched (the Drive MCP tools are read-only for Sheets); sync the xlsx back to Drive when ready.

`npm run build` passes after all fixes. Lint errors are only pre-existing vendored/minified-file and unused-vars noise.

---

## Completed

### Baseline (session 1)
- `npm run build` passes cleanly; lint noise is vendored files only.

### Module 6: ML Estimator API — ML-01 … ML-10 done
Sessions 1+2. Ran the FastAPI service live on port 8000. ML-01…ML-07 passed live (13/13 requests, latency ~40 ms). This session:
- **ML-08 PASS** — `price_per_sqm` appears nowhere in `pipeline.py`/`api.py` (no leakage); engineered features (`area_ratio`, `is_freehold`, `is_high_rise`, `month_sin/cos`, `district_period_median`, target-encoded scheme/state) match the design.
- **ML-09 PASS (code-verified)** — time-based split (train < 2024, test ≥ 2024), MAPE/R² logged for XGBoost + Random Forest comparison, versioned bundle `xgb_erumah_<version>.pkl` exported and its `version` field is what the API reports (`XGBoost_20260601_1347`). Full retrain not re-executed (Optuna 60 trials, long-running).
- **ML-10 PASS** — live POST /estimate returns price/bounds/disclaimer with `access-control-allow-origin: *` (CORS OK for the Vite origin); `PropertyCalculatorView` renders `estimated_price_rm`, bounds and the disclaimer; API-down and missing-env cases show a friendly error.

**Fixes (session 1):** api.py model cache + real model_version; pipeline.py lazy training imports; requirements split; PropertyCalculatorController missing-env error.
**Fix (session 2):** `PropertyCalculatorController.jsx` — FastAPI 422 `detail` arrays were rendered as `[object Object]`; now joined into readable field messages.

### Module 1: Health Monitoring — code-verified, bugs fixed (session 1)
Verified: HM-02 upload validation, HM-09 share access count, HM-11 expired-link block.
Fixes: real `HealthReport.delete()` (delete path was an update); `corsProxyFunctionInvoke` sub-path support so reminder-processor is invoked at `reminder-processor/run` (was a no-op).

### Module 2: Application Management — code-verified, bugs fixed (sessions 1+2)
Verified: autosave debounce (AM-02), submit + PDF flow (AM-06/AM-16), termination requires reason (AM-09/AM-11).
Fixes session 1: `is_encumbered` mapping; submit button stuck on failure; duplicate-person validation.
Fixes session 2 (AM-08/UM-11): **nominee editing after approval is now gated** — `/application/edit-nominees/:id` (editNomineeOnly mode) redirects back to `/user/application` when status is approved/terminated **unless** support flagged a nominee inactive (`nominee1_inactive` / `nominee2_inactive` / `both_nominees_inactive` replacement flow); the same guard blocks the save in `handleNext`.

### Module 3: Customer Support — code-verified, bugs fixed (session 1)
Verified: enquiry validation incl. temp-email rejection (CS-03), resolve/lock flow (CS-09).
Fix: realtime subscriptions used an unsupported double filter; chat now uses a single filter + client-side match.

### Module 4: Administrative — code-verified, bugs fixed (session 2)

**Bugs found and fixed:**
1. **`Application.flagDocument` did not exist** (AD-10) — the model file was corrupted: a stray `/**` comment swallowed a whole method block, so flagging a document during review threw "not a function" at runtime. Rebuilt the region as a proper `flagDocument()` that removes the file from `application-documents` storage (doc becomes MISSING for re-upload) and records `flagged_code: 'document_flagged'` + reason on the application.
2. **Approved-amount input on the review page crashed** (AD-03) — `AdminApplicationReviewView` expected `approvedAmount`/`onApprovedAmountChange` props that `AdminReportController` never passed (typing threw TypeError; approval saved no amount). Now wired up with validation (amount required when status is underReviewed) and passed to `Admin.approveApplication`.
3. **Shared report links were dead** (AD-07) — Share copied `/admin/report/:id`, but opening it fresh had no router state → redirect to dashboard. Added `Admin.getReportById()` (handles reports-table UUID, synthetic `monthly-YYYY-M`, and `yearly`) and a fallback fetch in viewReport mode.
4. **January monthly reports rendered as "Annual"** — `AdminReportView` treated `month === 0` as yearly; now checks null/undefined/negative.
5. **Empty termination-rejection reason accepted** (AD-09) — `window.prompt` empty string passed through; now requires non-empty reason.
6. **Admin decisions were never visible to the elder** (AD-05/AD-10) — added banners in `MaintainApplicationView`: rejection reason (status rejected + remarks) and flagged-document reason with re-upload instructions.
7. **Document flag now clears automatically** — after the elder re-uploads and no documents are MISSING, `MaintainApplicationController` calls `clearFlaggedStatus`.

### Module 5: User Management — code-verified, bugs fixed (session 2)

**Bugs found and fixed:**
1. `LoanDisbursement.buildSummary` read `latestTransaction.transaction_date` from already-mapped records (field is `transactionDate`) — "latest disbursement date" was always empty on the admin disbursements page.
2. `getUserPayoutDetails` ordered bank rows `created_at ascending`, while `saveBankDetails` always inserts a new `is_primary: true` row — so **re-saved bank details never took effect** (oldest row always won). Now orders newest first.

### Module 7: NFR & Security — code-verified subset (session 2)
- **NF-10/NF-08 (RBAC/auth redirect) PASS** — all `/admin/*`, `/support/*`, `/user/*` routes wrapped in `ProtectedRoute` with `requireRole`; unauthenticated → `/login`; role mismatch → own dashboard; `LoanDisbursementController` double-checks the admin role.
- **NF-11 (RLS) PASS (migrations-verified)** — RLS enabled on users/applications/application_data/nominees/properties/transactions/health_reports/inquiries with own-data policies (002, 003, 010, fix_properties_nominees_rls.sql). Live cross-user probe still worth doing.
- **NF-05 typeface DEVIATION** — primary font is **Poppins**, not Inter as the requirement states.
- **NF-06 palette** — `#A8202D` used across module CSS (contrast ratios need a live WCAG check).
- **NF-08 idle expiry FAIL** — no 30-minute inactivity logout; Supabase auto-refreshes sessions indefinitely.
- **NF-12 audit logging FAIL** — no audit/activity log exists anywhere.

---

## Per-test-ID status (for the spreadsheet fill-in)

Legend: statuses below are from code verification + the live ML API tests. "Pass*" = verified in code; a quick live UI confirmation is still advisable. Date tested: 2026-07-06.

### Module 1: Health Monitoring
| ID | Status | Remarks |
|----|--------|---------|
| HM-01 | Partial | image uploads (JPG/PNG/WEBP) always convert to PDF first via a confirm prompt; not stored natively as the test expects |
| HM-02 | Pass* | invalid file type/size blocked with plain-language message |
| HM-03 | Partial | own-reports-only confirmed; no "due date" column shown in the list |
| HM-04 | Pass* | search by title + provider name works; clear restores list |
| HM-05 | Pass* | filters combine correctly; Clear Filters resets all |
| HM-06 | Partial | sort dropdown missing "provider" and "due date" options |
| HM-07/HM-08 | Not tested live | reminder-processor invocation fixed session 1 (was a no-op) — needs a live re-test |
| HM-09 | Pass* | share access count + expiry stored correctly |
| HM-10 | Pass* | share-via-email + PDF download both work |
| HM-11 | Pass* | expired share links blocked |
| HM-12 | Pass* | archiving never deletes storage/rows — documents stay retrievable indefinitely |
| HM-13 | Pass* | admin sees all elders' reports with owner name |
| HM-14 | Partial | admin search missing `provider_name`; same sort gaps as HM-06 |
| HM-15 | Pass* | approve flow with confirmation modal works |
| HM-16 | **Pass* (fixed session 6)** | admin's Archived tab was always empty (role condition always false for admin) — fixed |
| HM-17 | Partial | reason mandatory + routes to support queue; elder notification is passive (banner only), no push/email |
| HM-18 | Partial | due-status (overdue/due soon) never reaches the per-row badge — UI/design gap, not fixed |
| HM-19 | Pass* | reminder create/edit/mark-notified/delete all persist and refresh lists |

### Module 2: Application Mgmt
| ID | Status | Remarks |
|----|--------|---------|
| AM-01 | Partial | all 7 steps navigable w/ progress indicator; no "select lending organisation" step; step titles differ from spec |
| AM-02 | Pass* | 1 s debounce + localStorage fallback verified |
| AM-03 | Pass* | age <55/>120 blocked; IC-derived DOB/sex auto-fill |
| AM-04 | Pass* | no native form validation; custom field-specific messages block Next |
| AM-05 | Partial | encumbrance/postcode/lease-years checks block; "unsupported property type" isn't actually a disqualifying check |
| AM-06 | Pass* | submit flow + PDF generation/upload verified; `is_encumbered` bug fixed |
| AM-07 | Partial | doc re-upload/termination/nominee-edit only; no personal/property-details edit on Maintain Application page |
| AM-08 | Pass* (fixed) | post-approval edit-nominees route + save now blocked (except inactive-nominee replacement) |
| AM-09/AM-11 | Pass* | termination requires reason |
| AM-10 | Pass* | status + timeline accurate; "draft" stage never reached by design (redirects to wizard instead) |
| AM-12 | **Fail** | nominee property redemption entirely unimplemented — no code path exists |
| AM-13 | **Fail** | no email/in-app notification on status change — no notification infra exists (reminders table is health-specific); session 4 added a *pending-payout* email notifier for admins (`loan-disbursement-notifier`), but that's unrelated to applicant-facing status-change notifications |
| AM-14 | Pass* | upload/delete/replace correctly leaves only the final document referenced |
| AM-15 | Pass* | duplicate-IC validation fixed session 1 |
| AM-16 | Pass* | PDF field mapping verified session 1 |
| AM-17 | Partial | return-with-notes = document flagging (now works, AD-10) + status modal remarks; elder now sees banners; no dedicated "returned" status |

### Module 3: Customer Support
| ID | Status | Remarks |
|----|--------|---------|
| CS-01 | Partial | FAQ covers 3 of 4 required topics; "required documents" isn't FAQ content |
| CS-02 | **Fail** | no guided tutorial/walkthrough for wizard or health-report upload |
| CS-03 | Pass* | incl. temp-email rejection |
| CS-04 | Partial | phone/email display works; no "operating hours" field exists anywhere |
| CS-05 | Partial | flagged-document alert real; deadline alert is passive-only; `Notification.js` is an empty stub |
| CS-06 | Pass* | inquiries listed + grouped by status |
| CS-07/CS-08 | Pass* (fixed) | realtime double-filter bug fixed session 1 — live two-browser test advisable |
| CS-09 | Pass* | resolve locks thread |
| CS-10 | **Fail** | no compose/broadcast capability for staff to message an elder or group |
| CS-11 | Pass* | contact-info edits persist and reload correctly, incl. cross-tab sync |
| CS-12 | Partial | staff can flag an application, but the flag never surfaces anywhere in the admin UI |
| CS-13 | Partial | flagged health reports reach the support queue, but the flag reason itself isn't rendered |
| CS-14 | Partial | sort + status filter work; search box is dead code (never wired to an input) |

### Module 4: Administrative
| ID | Status | Remarks |
|----|--------|---------|
| AD-01 | Pass* | list excludes drafts; detail + PDF viewer wired |
| AD-02 | Partial | status filter, text search (name/IC/email/address), date sort work; **no date-range or organisation filter** |
| AD-03 | Pass* (fixed) | review-page amount input crashed & amount was never saved; fixed + validated |
| AD-04 | Partial | notes via status-update modal remarks + document flagging; no dedicated return status |
| AD-05 | Pass* (fixed) | mandatory reason enforced; reason now shown to elder via banner |
| AD-06 | Pass* | monthly/yearly analysis reports with stats |
| AD-07 | Partial (share fixed) | download PDF + print + share work; **archive not implemented** |
| AD-08 | **Fail** | admin nominee approve/reject not implemented anywhere (`Nominee.updateStatus` exists but is never called; no UI) |
| AD-09 | Pass* (fixed) | empty rejection reason now blocked; approve/reject termination verified |
| AD-10 | Pass* (fixed) | `flagDocument` didn't exist (runtime error); now implemented end-to-end incl. elder banner + auto-clear on re-upload |
| AD-11 | Pass* | report generator modal (monthly/yearly) |
| AD-12 | Pass* | all admin routes `requireRole="admin"`; mismatch redirects |

### Module 5: User Management
| ID | Status | Remarks |
|----|--------|---------|
| UM-01 | Blocked (code) | no client-side `users` row insert and no trigger in repo migrations — profile row must come from a DB trigger in live Supabase; verify live |
| UM-02/UM-03 | Pass* | standard Supabase auth; staff role from metadata → admins/customer_supports fallback |
| UM-04 | Pass* | incomplete → /application, terminated blocked from /application, localStorage cache |
| UM-05 | Pass* | dashboard estimate + re-estimate calls estimator API (note: new estimate is not persisted to DB — reverts on reload) |
| UM-06 | Partial | monthly = approved_amount / 240 (or 70% of property value); **age/property type/location are not factored** as FR5.2 describes |
| UM-07 | **Fail** | nominee apportioned-proceeds calculation not implemented anywhere |
| UM-08 | Pass* | history + filter ("last6months" filter actually means last 6 records) |
| UM-09 | Pass* | totals = sum of transactions; remaining = eligible − disbursed |
| UM-10 | Pass* | nominee validation in wizard (Module 2 checks) |
| UM-11 | Pass* (fixed) | same fix as AM-08 |
| UM-12 | Pass* (fixed) | bank-specific account validation exists; stale-row read bug fixed |
| UM-13 | Partial (improved session 4) | create works, only approved apps selectable, catch-up suggestion; auto-scheduled pending slots can now be reviewed/confirmed/skipped (session 4 — double-confirm race found & fixed); **still no edit of an already-confirmed/manual disbursement record** |
| UM-14 | **Fail** | no admin UI to update the verified property value (`expected_market_value` only written at submission) |
| UM-15 | Pass* | public route, custom validation, reset; live-tested API + UI renders result |

### Module 6: ML Estimator API
| ID | Status | Remarks |
|----|--------|---------|
| ML-01…ML-07 | Pass (live) | session 1, 13/13 |
| ML-08 | Pass | no price_per_sqm at inference; features as designed |
| ML-09 | Pass* | code + existing versioned artifact; full retrain not re-run |
| ML-10 | Pass | live API + CORS + UI rendering + friendly errors |

### Module 7: NFR & Security
| ID | Status | Remarks |
|----|--------|---------|
| NF-01…NF-04 | Not tested | need live timing runs |
| NF-05 | Partial | font is Poppins, requirement says Inter; sizes need visual check |
| NF-06 | Not tested | palette applied; needs WCAG contrast tool |
| NF-07 | Pass* | validation messages reviewed across forms are plain-language and field-specific |
| NF-08 | Partial | unauthenticated redirect works; **no 30-min idle expiry** |
| NF-09 | Blocked | needs deployed site |
| NF-10 | Pass* | RBAC verified in code |
| NF-11 | Pass* | RLS policies in migrations; live cross-user probe advisable |
| NF-12 | **Fail** | no audit logging |
| NF-13/NF-14 | Not tested | manual/browser matrix |

---

## Files changed this session (session 4)
- `src/models/LoanDisbursement.js` — **bug fix**: `confirmScheduledDisbursement` race condition (double-disbursement risk) — atomic claim via conditional UPDATE, rollback-on-failure. This is the only file this session's testing pass itself modified; everything else below was already-uncommitted work from before this session that got code-verified.
- Pre-existing uncommitted (verified this session, not modified): `src/controllers/LoanDisbursementController.jsx`, `src/views/LoanDisbursementView.jsx`, `src/data_access_controller/migrations/021_loan_disbursement_automation.sql`, `src/data_access_controller/functions/loan-disbursement-notifier/index.txt` (new edge function); `src/controllers/AdminController.jsx`, `src/views/AdminView.jsx`, `src/controllers/AdminReportController.jsx`, `src/models/Admin.js`, `src/data_access_controller/migrations/020_reports_created_at_and_rejected_at.sql`, `src/data_access_controller/functions/revoke-share-proxy/index.txt`; `src/controllers/ApplicationController.jsx`, `src/views/ApplicationFormView.jsx`, `src/utils/applicationValidation.js`, `src/services/fileUploadService.js`; `src/client_controller/sessionController/AuthContext.jsx`, `src/controllers/HealthReportController.jsx`, `src/views/HealthMonitoringView.jsx`, `src/views/PropertyCalculatorView.jsx`; various CSS responsive tweaks; `src/data_access_controller/migrations/schema.sql` (regenerated to match 020+021).
- ML model retrained: `property_value_estimator/models/xgb_erumah_20260709_1256.pkl` (new, now `xgb_erumah_latest.pkl`), SHAP images regenerated. Live-smoke-tested — `/health` and `/estimate` both work, `model_version` reports correctly.
- Deleted (not code, a planning-notes scratch file, not a testing concern): `layers.txt`.
- New untracked: `"test data/"` — manual upload fixtures (MYKAD/payslip/income/birth-cert/bank-statement/property-proof images incl. WEBP, PDFs incl. an oversized one to trigger compression, an `edge-cases` subfolder) for exercising the application wizard's document upload paths.

## Files changed session 2 (for reference, now committed in `ee5fa23`)
- `src/models/Application.js` — repaired corrupted comment block; implemented `flagDocument`
- `src/models/Admin.js` — added `getReportById`
- `src/models/LoanDisbursement.js` — latestDisbursementDate field fix; bank-details row order fix
- `src/controllers/AdminReportController.jsx` — approvedAmount state/validation/props; shared-report fallback load
- `src/controllers/AdminController.jsx` — termination rejection requires non-empty reason
- `src/controllers/ApplicationController.jsx` — post-approval nominee-edit gate (load + save)
- `src/controllers/MaintainApplicationController.jsx` — auto-clear document flag after re-upload
- `src/controllers/PropertyCalculatorController.jsx` — readable 422 errors
- `src/views/AdminReportView.jsx` — January/yearly detection fix
- `src/views/MaintainApplicationView.jsx` — rejection + flagged-document banners

## Outstanding work
0. **(session 6)** Session 2/3 work is committed (`ee5fa23`). Sessions 4-6's work (loan disbursement automation, admin stats, wizard UX, AuthContext dedup, the race-condition fix, the stale-pending-list fix, the HM-16 archived-tab fix) are all still uncommitted in the working tree. Review and commit when ready — exclude `__pycache__/*.pyc` and the regenerated SHAP PNGs/model pkl from the diff review (binary, expected to churn) but they should still be committed since `xgb_erumah_latest.pkl` is the file the API actually loads.
1. **Live UI testing** of the items marked Pass*/Not tested (needs `npm run dev` + Supabase test accounts for elder/admin/support) — in addition to everything already queued: the newly-code-verified session-6 items (esp. HM-16's fix, HM-01's forced-PDF-conversion UX, the CS-14 dead search box), the pending-disbursement review/confirm/skip flow, the corrected admin dashboard stat cards, the wizard's employer-N/A/joint-applicant-sync behavior, and the `revoke-share-proxy` edge function redeploy.
2. **Sync the filled xlsx back to the Google Sheet** — done locally in `e-Rumah_Testing_Verification_Checklist.xlsx` (checklist actually has 108 rows, not 101 as originally scoped; 99 of 108 are now filled — only HM-07/HM-08 (need a live reminder-processor re-test) and NF-01/02/03/04/06/13/14 (all genuinely require live tools/browsers/timing) remain "Not Tested"); upload/import it to Drive (the MCP tools here can't write Sheets).
3. **Decide on genuine feature gaps** (implement or accept as Fail) — the session-6 batch adds several new ones to the existing list: AD-08 nominee approve/reject, UM-07 apportioned proceeds, UM-14 verified-value update UI, AM-13 applicant-facing status-change notifications, NF-08 idle timeout, NF-12 audit logging, report archive (AD-07), UM-13 editing of confirmed/manual disbursements, **AM-01 lending-organisation selection, AM-12 nominee redemption, CS-02 tutorials/walkthroughs, CS-04 operating-hours field, CS-05 deadline alerts, CS-10 staff broadcast/compose, CS-12 flag-not-surfaced-to-admin, CS-13 flag-reason-not-shown, CS-14 dead search box, HM-18 due-status badge UI.**
4. **Commit the fixes** — still nothing committed; exclude `__pycache__/*.pyc` noise when staging.
5. NF performance checks (NF-01…NF-04), NF-06 WCAG contrast, NF-13 touch-target/usability, and NF-14 cross-browser once running live — none of these are code-traceable.
6. **Enable pg_cron/pg_net + fill vault secrets** for migration 021's two new cron jobs (mirrors the still-outstanding migration 018 setup) — nothing here confirms the loan-disbursement auto-scheduling or notifier actually fire in the live project.

## How to resume the ML API locally

```bash
# venv is at the repo root (.venv) and already has the serving deps installed
cd property_value_estimator
../.venv/Scripts/python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000
# health check: curl http://localhost:8000/health
```
