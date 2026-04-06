# Software Requirements Specification (SRS)
## Vaccine Hesitancy Assessment & Response System

**Project Version:** 1.0
**Date Created:** 2026-04-06
**Status:** Active Development
**Tech Stack:** HTML, CSS, JavaScript, MongoDB, Node.js, Express.js

---

## 1. EXECUTIVE SUMMARY

The Vaccine Hesitancy Assessment & Response System is a patented digital platform designed to:
- Assess individual vaccine hesitancy through guided, multilingual surveys
- Provide personalized, doctor-curated responses to hesitancy factors
- Enable institutions and healthcare organizations to measure population-level hesitancy
- Empower doctors to contribute evidence-based content
- Maintain governance through admin oversight and DPDP compliance

The system uses SHAP (SHapley Additive exPlanations) interpretability to explain ML-predicted hesitancy factors to users in plain, empathetic language.

---

## 2. SYSTEM OVERVIEW

### 2.1 Architecture
- **Frontend:** HTML/CSS/JavaScript (responsive, multilingual)
- **Backend:** Node.js + Express.js REST API
- **Database:** MongoDB (documents for users, surveys, submissions, content)
- **ML Component:** Python-based SHAP analysis (integrated via API or batch job)
- **Data Processing:** CSV upload/parsing for institutional surveys

### 2.2 Key Stakeholders
1. **Individuals** – Take assessments anonymously, receive personalized guidance
2. **Institutions** – Upload population datasets, receive segmented reports
3. **Doctors** – Submit myth-busting content, manage contributions
4. **Admins** – Approve/monitor accounts, review submissions, oversee data integrity
5. **Regulators** – Monitor DPDP Act 2023 compliance, access audit logs

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Landing Page (Public, No Login)

**Purpose:** First touchpoint for all users. Clear value proposition and navigation.

**Features:**
- Hero section with headline + subheading
- Two primary CTA buttons: "Check my hesitancy" (Individual) | "I'm from an institution" (Org)
- "How it works" section (3-step explainer with icons)
- Trust section:
  - "Verified by doctors" badge
  - "DPDP Act 2023 compliant" compliance statement
  - Link to privacy policy
- Myth-busting library preview (3-4 sample myth/fact pairs)
- FAQ section (collapsible)
- Navigation: Home, About, Contact, FAQ, Privacy Policy

**Data to Store:** Page view analytics (optional)

---

### 3.2 Individual Assessment Page (Public, No Login Required)

**Purpose:** Core public-facing assessment flow. Collect hesitancy signals.

**Features:**

#### 3.2.1 Survey Structure
- **12–15 questions** split into 3 sections:
  - Section 1: Demographics (Age, Gender, Education, Employment, Location)
  - Section 2: Prior Experience (Vaccination history, side effects, trusted sources)
  - Section 3: Attitudes & Trust (Confidence in approval process, concern about ingredients, trust in doctors)

- **Response Types:**
  - Likert Scale (1–5: Strongly Disagree to Strongly Agree)
  - Yes/No/Unsure

#### 3.2.2 UX & Functionality
- Progress bar (% complete)
- Question-by-question flow (one screen per question or grouped)
- Multilingual interface toggle (English, Hindi, regional languages — configurable)
- "Back" and "Next" buttons
- Save draft option (store in browser localStorage initially, DB after login)
- Estimated time: 3–5 minutes
- Mobile-responsive design

#### 3.2.3 Silent Background Validation (No User Visibility)
- **Contradiction Detection:** Flag if responses conflict (e.g., "Trust doctors" but "Scared of vaccines")
- **Response Time Floor:** Reject if entire survey completed in < 30 seconds
- **Straight-Line Pattern:** Flag if all responses are identical (e.g., all "Strongly Agree")
- **Logical Inconsistency:** Cross-question checks (e.g., "Prior vaccination" conflicts with "Never had vaccine")

**Validation Result:**
- *Valid* → Proceed to Results Page
- *Suspicious* → Store flag, calculate score anyway, but mark in DB for admin review

**Data to Store in MongoDB:**
```
{
  survey_id: UUID,
  responses: {
    q1: value,
    q2: value,
    ...
  },
  metadata: {
    timestamp: DateTime,
    device: mobile/desktop,
    language: en/hi/other,
    session_id: UUID
  },
  validation: {
    passed: Boolean,
    flags: [String],
    risk_score: 0-1
  }
}
```

---

### 3.3 Results Page (Individual, No Login)

**Purpose:** Immediately show personalized hesitancy assessment + actionable guidance.

**Features:**

#### 3.3.1 Hesitancy Score Visualization
- **Visual Gauge:** 0–100 scale with colour-coded zones:
  - 0–25: **Confident** (Green) – "You're well-informed and ready"
  - 26–50: **Mildly Hesitant** (Yellow) – "You have some concerns"
  - 51–75: **Moderately Hesitant** (Orange) – "You want more information"
  - 76–100: **Strongly Hesitant** (Red) – "You have significant concerns"

- **Design Rule:** Score never shown in isolation. Always accompanied by factor breakdown.

#### 3.3.2 SHAP Factor Breakdown
- **Top 2–3 Hesitancy Drivers:**
  - e.g., "Side effects concern (45% influence)", "Trust in approval process (30%)", "Peer influence (25%)"
  - Displayed in plain, **empathetic language** (not clinical)
  - Each factor linked to doctor-curated myth-busting content

#### 3.3.3 Doctor-Curated Myth Busting
- Show top 3 myth-busting responses matched to user's hesitancy factors
- For each response:
  - **Myth:** "Vaccines cause…"
  - **Fact:** Evidence-based counter (250 words max)
  - **Doctor Info:** Name, qualification (e.g., MBBS, MD), institution
  - **Source:** Link to evidence (PubMed, WHO, etc.)
  - **Rating:** Doctor approval status + reviews (if applicable)

#### 3.3.4 Action Links
- **Find Vaccination Centre:** Address + hours (integrated with national health registry or embed Google Maps)
- **National Helplines:** State/national helpline numbers + WhatsApp bot link (if available)
- **More Information:** Links to WHO, national health ministry resources

#### 3.3.5 Data Contribution Opt-In
- Non-mandatory checkbox: "Help research by contributing anonymised data"
- Privacy statement: "Your name and contact details will never be stored. Only responses are used."
- If checked, set `contribute_anonymised = true` in DB (actual data is PII-stripped before export)

#### 3.3.6 Fallback Content
- If user's validation risk is high, show additional disclaimer:
  - "We've detected some inconsistencies in responses. For accurate guidance, please consult a healthcare provider."

**Data to Store:**
```
{
  result_id: UUID,
  survey_id: UUID_reference,
  hesitancy_score: 0-100,
  tier: "Confident"|"Mildly Hesitant"|"Moderately Hesitant"|"Strongly Hesitant",
  shap_factors: [
    {
      factor: String,
      influence_percentage: 0-100,
      explanation: String
    }
  ],
  recommended_myths: [mythology_id_references],
  validation_flags: [String],
  contribute_anonymised: Boolean,
  result_timestamp: DateTime,
  viewed_at: DateTime
}
```

---

### 3.4 User Registration & Login (Optional Pre-Login)

**Purpose:** Enable users to save assessments, track progress, access institutional features.

**Features:**
- Email-based registration (no mobile OTP for simplicity initially)
- Login with email + password
- "Forgot Password" flow (email link)
- Optional: Google/Apple SSO
- Role-based access (Individual, Doctor, Institution Admin, System Admin)

**Data to Store:**
```
{
  user_id: UUID,
  email: String (unique),
  password_hash: String,
  role: "individual"|"doctor"|"institution"|"admin",
  verified: Boolean,
  created_at: DateTime,
  profile: {
    name: String (optional),
    institution: String (optional for doctors),
    nmc_registration: String (for doctors only)
  }
}
```

---

### 3.5 Individual Dashboard (Post-Login)

**Purpose:** Personal hub for logged-in individuals to track assessments.

**Features:**
- List of past surveys with dates + scores
- Option to retake assessment
- Saved drafts
- Data download (CSV export of own responses – GDPR-style)
- Privacy settings (opt-in/out of research contribution)

---

### 3.6 Institutional Portal (Verified Institution Login)

**Purpose:** Allow organizations (healthcare, NGO, government) to upload population datasets and get insights.

**Features:**

#### 3.6.1 CSV Upload & Processing
- File upload interface (drag-and-drop + button)
- Supported format: CSV with columns matching survey questions
- Max file size: 50 MB (configurable)
- Auto-parsing with progress indicator

#### 3.6.2 Field Mapping Interface
- If CSV column names don't match system schema, show mapping UI:
  ```
  CSV Column | System Field
  ----------------------------------------
  Age        | demographics_age
  Vaccine    | prior_experience_vaccinated
  Trust      | attitude_trust_doctors
  ```
- Save mapping as template for future uploads

#### 3.6.3 Quality Scoring & Validation
- Automated quality check for each row:
  - Missing values count
  - Outliers
  - Logical inconsistencies
- **Score:** % rows passing validation
  - **≥ 85%:** Auto-proceed to analysis
  - **60–85%:** Flag rows, show error report, allow skip/retry
  - **< 60%:** Reject entire upload, provide detailed error report

#### 3.6.4 SHAP-Powered Segmentation Dashboard
- **Overall Stats:**
  - Total responses analyzed
  - Mean hesitancy score
  - Score distribution chart (histogram)

- **Tier Breakdown:**
  - Count + % in each tier (Confident, Mildly Hesitant, etc.)
  - Visual bar chart

- **Demographic Filters:**
  - Dropdown filters for Age, Gender, Education, Location
  - Real-time chart updates

- **SHAP Factor Heatmap:**
  - Rows: Demographics (Age groups, Gender, etc.)
  - Columns: Hesitancy factors (Side effects, Trust, etc.)
  - Cell colour: Average influence % of that factor in that demographic
  - Reveals subgroup patterns (e.g., "Young women concern most about fertility myth")

- **Regional Calibration Flag:**
  - If score distribution differs significantly from national baseline, alert user:
    - "This region's hesitancy is 20% higher than national average. Consider targeted interventions."

#### 3.6.5 Myth-Busting Campaign Recommendations
- AI-powered suggestions: "Your population's top concern is 'Side effects'. Consider launching campaign with myth content ID: M_45, M_67."
- Directly link to doctor-curated content

#### 3.6.6 PDF Export
- One-click stakeholder report generation (PDF format)
- Includes: summary stats, charts, factor heatmap, campaign recommendations
- Auto-timestamp + institution logo (if provided)

#### 3.6.7 Data Lifecycle
- **Retention:** Raw uploaded CSV auto-deleted within 24 hours
- **Processed Data:** Aggregated (anonymised) results stored for 2 years, then archived/deleted
- **Audit Trail:** Log all uploads + exports for compliance

**Data to Store:**
```
{
  upload_id: UUID,
  institution_id: UUID_reference,
  filename: String,
  upload_date: DateTime,
  row_count: Int,
  quality_score: 0-100,
  validation_results: {
    passed_rows: Int,
    flagged_rows: Int,
    errors: [String]
  },
  field_mapping: { CSV_col: system_field },
  aggregated_results: {
    mean_score: 0-100,
    tier_distribution: { tier: count },
    factor_heatmap: Matrix,
    regional_flags: [String]
  },
  export_history: [{ export_date, export_type, user_id }],
  status: "pending"|"processing"|"completed"|"failed",
  deleted_at: DateTime (after 24h)
}
```

---

### 3.7 Doctor Contribution Portal (Verified Doctor Login)

**Purpose:** Structured channel for doctors to contribute myth-busting content.

**Features:**

#### 3.7.1 Submission Form
- **Hesitancy Concern:** Dropdown list (e.g., "Vaccines cause infertility", "Microchip tracking", "Weakens immune system")
- **Evidence-Based Response:** Rich text editor (2000 chars max, formatting allowed)
- **Source Citation:**
  - PubMed ID/link, WHO link, or institutional source
  - Auto-validation of URLs
- **NMC Registration Number:** Text field (verified against national registry on submit)
- **Supporting Documents:** Optional PDF upload (clinical trials, studies, etc.)

#### 3.7.2 Review Queue
- Submissions automatically enter admin review queue
- **Status:** Draft → Pending Review → Approved/Rejected/Revision Requested → Published
- Doctor receives email notification at each status change

#### 3.7.3 Published Content Visibility
- Once approved, doctor name + qualification publicly visible on results pages
- Content can be rated by users (optional, non-binding)
- Built-in accountability mechanism

#### 3.7.4 Content Management Dashboard
- List of doctor's submissions with status badges
- Filter by status, date, concern type
- Resubmit rejected content
- **Mandatory 12-Month Review Cycle:**
  - Email reminder: "Please re-confirm your content M_45 is still accurate"
  - Checkbox: "This information is still accurate and evidence-based"
  - If not confirmed within 30 days, content auto-unpublished with notification

#### 3.7.5 Analytics
- View count for each submission
- Demographic breakdown of users viewing content
- Feedback summary (comments from users, if enabled)

**Data to Store:**
```
{
  content_id: UUID,
  doctor_id: UUID_reference,
  concern: String,
  response: String,
  sources: [{ type, link, metadata }],
  nmc_registration: String,
  supporting_docs: [file_ids],
  status: "draft"|"pending_review"|"approved"|"rejected"|"revision_requested"|"published",
  created_at: DateTime,
  submitted_at: DateTime,
  reviewed_by: admin_id (if approved/rejected),
  review_notes: String,
  published_at: DateTime,
  last_confirmed_at: DateTime,
  view_count: Int,
  rating_avg: 0-5 (optional)
}
```

---

### 3.8 Admin Panel (Internal, Staff Only)

**Purpose:** Governance, moderation, and internal oversight.

**Features:**

#### 3.8.1 Account Approval Queue
- **Pending Institutions:** List with org name, contact, purpose, uploaded documents
  - Action buttons: Approve, Reject (with notes), Request More Info
  - Approval triggers: Account activated, API key issued

- **Pending Doctors:** List with name, NMC number, institution, submission count
  - Auto-verify NMC number against national registry Database
  - Manual override option
  - Approval triggers: Doctor role activated

#### 3.8.2 Doctor Credential Verification
- Background queue checking NMC registration for:
  - Active license status
  - No disciplinary action
  - Correct specialization (optional filter)
- Alert if status changes (e.g., license revoked)
- Manual verification overrides

#### 3.8.3 Myth Library Moderation
- List all submitted content with status
- Inline review interface:
  - View full content
  - Tabs: Submission | Evidence Check | Doctor Profile
  - Action buttons: Approve, Reject, Request Revision
  - Notes field for feedback to doctor
- Filter by: Status, Doctor, Concern Type, Date Range
- Bulk actions: Approve multiple, Archive old content

#### 3.8.4 Usage Audit Logs
- Immutable log of all system actions:
  - User registrations + role changes
  - Survey submissions + scores
  - CSV uploads + deletions
  - Content approvals
  - Data exports
- Searchable by: User, Date, Action Type, Resource ID
- Log retention: Minimum 5 years (DPDP compliance)
- Export as CSV for compliance reporting

#### 3.8.5 Anomaly Flag Review
- List surveys flagged by background validation:
  - Contradiction detected
  - Response time too fast
  - Straight-line responses
  - Outlier score (e.g., 0 or 100)
- For each: Review responses, reason for flag
- Action: Mark false positive, escalate to investigation, block user
- Pattern analysis: Identify coordinated spam (100 surveys from same IP in 1 minute)

#### 3.8.6 Retraining Pipeline Status
- Dashboard showing ML model performance:
  - Last retraining date
  - Model accuracy metrics (if available)
  - New training job status
  - Data drift indicators
- Action buttons: Trigger manual retrain, quarantine batch (pause predictions)

#### 3.8.7 Account-Level Pattern Flagging
- Alert for misuse patterns:
  - 1000+ surveys from single IP in 1 hour (spam bot)
  - Institution uploading contradictory bulk data
  - Doctor with unusually high rejection rate
- Action: Investigate, warn, suspend, ban

#### 3.8.8 DPDP Compliance Dashboard
- Summary of PII handling:
  - Data collection points + legal basis
  - Data retention policies
  - Deletion audit trail
  - Export requests (if user-initiated)
- Generate compliance report (for privacy officer)

**Data to Store:**
```
{
  log_entry_id: UUID,
  timestamp: DateTime,
  actor_id: user_id,
  actor_role: String,
  action: String,
  resource_type: String,
  resource_id: UUID,
  old_value: JSON (optional),
  new_value: JSON (optional),
  ip_address: String,
  user_agent: String,
  status: "success"|"failure",
  error_message: String (if failed)
}
```

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance
- Page load time: < 2 seconds (p95)
- API response time: < 500ms (p95)
- SHAP calculation: < 30 seconds for predictions
- CSV processing: 1000 rows in < 5 minutes

### 4.2 Security
- HTTPS only
- Password hashing: bcrypt (12 rounds minimum)
- Session tokens: JWT with 1-hour expiry
- CSRF protection on all POST endpoints
- Rate limiting: 100 requests/minute per IP
- SQL/NoSQL injection prevention (parameterised queries, input validation)
- CORS configured for frontend domain only

### 4.3 Compliance
- DPDP Act 2023: Data minimization, consent tracking, deletion on request
- Doctor verification: Against NMC registry
- Audit logging: 5-year retention
- Privacy By Design: PII stripped from datasets before analysis
- Accessibility: WCAG 2.1 Level AA compliance

### 4.4 Scalability
- Database: MongoDB sharding for 100M+ surveys
- Backend: Horizontal scaling with load balancer
- Frontend: CDN for static assets
- ML inference: Batch processing or async queues

### 4.5 Availability
- Uptime target: 99.5% (max 3.6 hours downtime/month)
- Disaster recovery: Daily backups, 24-hour RTO
- Incident response: 1-hour alert-to-fix SLA

### 4.6 Usability
- Multilingual support (≥ 5 languages)
- Mobile-first responsive design
- Accessible keyboard navigation
- Screen reader compatibility
- Plain language (Flesch-Kincaid 8th grade max)

---

## 5. DATA FLOW & PREDICTION MODEL

### 5.1 Training Data
- **Source:** CSV files provided (democracy datasets, healthcare datasets, etc.)
- **Processing:**
  - Load CSV → clean & validate → encode categorical vars → normalize numerics
  - Train/test split: 80/20
  - Model: Random Forest or Gradient Boosting (suitable for SHAP)

### 5.2 Prediction Pipeline
1. User submits survey responses
2. Background validation run (contradiction, patterns, etc.)
3. If valid/low-risk: Call ML model
4. Model predicts hesitancy score (0-100)
5. SHAP explains top contributing factors
6. Results cached in DB
7. Results page rendered with score + factors + curated content

### 5.3 Model Retraining
- Trigger: Monthly or when 10K new labelled surveys accumulated
- Process: Retrain on accumulated data, validate on holdout set
- Deployment: Canary deploy (10% traffic) → full rollout if metrics stable
- Rollback: Automatic if accuracy drops > 5%

### 5.4 Feature Engineering
From survey responses:
- Demographics: Age group, gender, education level, employment
- Prior experience: Vaccination history, adverse reactions, trusted sources
- Attitudes: Opinions on vaccines, trust in institutions, social influence

---

## 6. DATABASE SCHEMA (MONGODB)

**Collections:**

1. **users**
   - _id, email, password_hash, role, verified, created_at

2. **surveys**
   - _id, responses{}, metadata{}, validation{}, timestamp

3. **results**
   - _id, survey_id, hesitancy_score, tier, shap_factors[], validation_flags[], contribute_anonymised

4. **myths**
   - _id, concern, response, sources[], doctor_id, status, published_at

5. **institutions**
   - _id, name, contact, purpose, verified, api_key, created_at

6. **uploads**
   - _id, institution_id, filename, upload_date, quality_score, aggregated_results{}, status

7. **audit_logs**
   - _id, timestamp, actor_id, action, resource_type, resource_id, details{}

---

## 7. API ENDPOINTS

**Public (No Auth):**
- POST /api/survey/submit – Submit survey responses
- GET /api/results/:resultId – Fetch result
- GET /api/myths – List approved myths
- GET /api/landing – Landing page content

**Authenticated (JWT):**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/user/dashboard
- POST /api/institutional/upload
- GET /api/institutional/analysis
- POST /api/doctor/submit-myth
- GET /api/doctor/submissions

**Admin Only:**
- GET /api/admin/queue/institutions
- POST /api/admin/approve-institution/:id
- GET /api/admin/queue/doctors
- POST /api/admin/verify-doctor/:id
- GET /api/admin/audit-logs
- POST /api/admin/flag-review

---

## 8. DEVELOPMENT PHASES

**Phase 1 (Weeks 1–2):** Landing page, Individual assessment, Basic results
**Phase 2 (Weeks 3–4):** User auth, Results page enhancements, ML integration
**Phase 3 (Weeks 5–6):** Institutional portal, CSV upload & analysis
**Phase 4 (Weeks 7–8):** Doctor portal, Content management
**Phase 5 (Weeks 9–10):** Admin panel, Audit logging, Compliance
**Phase 6 (Weeks 11–12):** Testing, Security audit, Deployment

---

## 9. TESTING STRATEGY

- **Unit Tests:** Models, utilities, validation functions
- **Integration Tests:** API endpoints, DB operations
- **E2E Tests:** User flows (survey → results → export)
- **Security Tests:** OWASP Top 10, penetration testing
- **Load Tests:** 1000 concurrent users, 10K responses/minute

---

## 10. DEPLOYMENT & INFRASTRUCTURE

- **Hosting:** Cloud platform (AWS/GCP/Azure)
- **Database:** MongoDB Atlas (managed)
- **Backend:** Node.js on Heroku or Docker containers
- **Frontend:** Static hosting (Vercel, Netlify)
- **ML Service:** Separate containerized service for inference
- **Monitoring:** DataDog or CloudWatch for logs & metrics
- **CI/CD:** GitHub Actions for automated testing & deployment

---

## 11. CONSTRAINTS & ASSUMPTIONS

**Constraints:**
- No real-time video consultation (design out of scope)
- ML model predicts score only (no treatment recommendations)
- Limited to Indian national healthcare context initially

**Assumptions:**
- Users are 18+ years old
- CSV data is already cleaned (system will validate but not auto-repair)
- Doctors' NMC registration is publicly verifiable
- Internet connectivity available for assessments

---

**End of SRS Document**
