# Testing Session Handoff — e-Rumah Verification Checklist

**Last session:** 2026-07-06 (session 2 — completed the code-verification sweep of all remaining modules).
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
| HM-01…HM-19 | mostly untested live | Code-verified: HM-02 Pass*, HM-09 Pass*, HM-11 Pass*. HM-07/HM-08 reminder-processor invocation fixed session 1 (was a no-op) — needs a live re-test. Others need live UI testing. |

### Module 2: Application Mgmt
| ID | Status | Remarks |
|----|--------|---------|
| AM-02 | Pass* | 1 s debounce + localStorage fallback verified |
| AM-06 | Pass* | submit flow + PDF generation/upload verified; `is_encumbered` bug fixed |
| AM-08 | Pass* (fixed) | post-approval edit-nominees route + save now blocked (except inactive-nominee replacement) |
| AM-09/AM-11 | Pass* | termination requires reason |
| AM-13 | **Fail** | no email/in-app notification on status change — no notification infra exists (reminders table is health-specific) |
| AM-15 | Pass* | duplicate-IC validation fixed session 1 |
| AM-16 | Pass* | PDF field mapping verified session 1 |
| AM-17 | Partial | return-with-notes = document flagging (now works, AD-10) + status modal remarks; elder now sees banners; no dedicated "returned" status |
| others | Not tested live | |

### Module 3: Customer Support
| ID | Status | Remarks |
|----|--------|---------|
| CS-03 | Pass* | incl. temp-email rejection |
| CS-07/CS-08 | Pass* (fixed) | realtime double-filter bug fixed session 1 — live two-browser test advisable |
| CS-09 | Pass* | resolve locks thread |
| others | Not tested live | |

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
| UM-13 | Partial | create works, only approved apps selectable, catch-up suggestion; **no edit of an existing disbursement record** |
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

## Files changed this session (session 2, all uncommitted)
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
1. **Live UI testing** of the items marked Pass*/Not tested (needs `npm run dev` + Supabase test accounts for elder/admin/support).
2. **Sync the filled xlsx back to the Google Sheet** — done locally in `e-Rumah_Testing_Verification_Checklist.xlsx`; upload/import it to Drive (the MCP tools here can't write Sheets). Update the remaining "Not Tested" rows after live UI runs.
3. **Decide on genuine feature gaps** (implement or accept as Fail): AD-08 nominee approve/reject, UM-07 apportioned proceeds, UM-14 verified-value update UI, AM-13 notifications, NF-08 idle timeout, NF-12 audit logging, report archive (AD-07).
4. **Commit the fixes** — still nothing committed; exclude `__pycache__/*.pyc` noise when staging.
5. NF performance checks (NF-01…NF-04) once running live.

## How to resume the ML API locally

```bash
# venv is at the repo root (.venv) and already has the serving deps installed
cd property_value_estimator
../.venv/Scripts/python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000
# health check: curl http://localhost:8000/health
```
