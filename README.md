# Vaccine Hesitancy Assessment & Response System

A **patented digital platform** designed to assess vaccine hesitancy through AI-powered surveys and provide personalized, doctor-curated responses backed by evidence.

**Built with:** HTML, CSS, JavaScript, Node.js, Express.js, MongoDB, Python, SHAP

![Status](https://img.shields.io/badge/status-active%20development-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🎯 Features

### For Individuals
- 📋 **12-15 Question Survey** — Assess your vaccine hesitancy in 3-5 minutes
- 🎨 **Personalized Results** — Visual gauge + AI-identified hesitancy factors
- 👨‍⚕️ **Doctor-Verified Guidance** — Myth-busting content from certified medical professionals
- 🔒 **Completely Anonymous** — No personal data required (DPDP Act 2023 compliant)

### For Institutions & Organizations
- 📊 **Bulk Assessment** — Upload population CSV → Get instant segmentation analysis
- 🔍 **SHAP-Powered Insights** — Understand hesitancy patterns by demographic
- 📈 **Regional Calibration** — Compare your population to national benchmarks
- 📥 **Stakeholder Reports** — One-click PDF export with recommendations

### For Doctors
- ✍️ **Myth Submission Portal** — Contribute evidence-based responses
- ✅ **Peer Review Process** — Admin-moderated quality gate
- 📊 **Content Analytics** — Track reach and impact of your contributions
- 🔄 **Annual Re-confirmation** — Maintain content accuracy with automated reminders

### For Admins
- 👥 **Account Management** — Approve institutions & verify doctor credentials
- 📚 **Content Moderation** — Review & publish myth-busting submissions
- 🔐 **Audit Logging** — Full compliance trail for DPDP & regulatory requirements
- 🚨 **Anomaly Detection** — Identify suspicious patterns, flagged responses

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 16.0 (Backend)
- **Python** ≥ 3.9 (ML Service)
- **MongoDB** (Atlas or local)
- **Git**

### Installation

#### 1. Clone & Setup
```bash
git clone <repo-url>
cd vaccine-hesitancy-system
```

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# ✅ Backend running on http://localhost:5000
```

#### 3. ML Service Setup
```bash
cd ../ml_service
cp .env.example .env
pip install -r requirements.txt

# Train the model (loads CSV data)
python src/train_model.py

# Start Flask API
python src/app.py
# ✅ ML Service running on http://localhost:8000
```

#### 4. Frontend
```bash
# Option A: Open in browser
open frontend/public/index.html

# Option B: Use simple HTTP server
cd frontend/public
python -m http.server 3000
# ✅ Frontend available at http://localhost:3000
```

### 5. Test the System
- 🌐 Open http://localhost:3000 → Click **"Check my hesitancy"**
- 📋 Fill out survey → Instant results with SHAP factors
- 👨‍⚕️ View doctor-verified myth responses

---

## 📁 Project Structure

```
vaccine-hesitancy-system/
├── backend/              # Node.js/Express API
├── frontend/             # HTML/CSS/JavaScript UI
├── ml_service/           # Python/Flask ML inference
├── docs/                 # API, design, deployment docs
├── SRS.md                # Software Requirements Specification
├── PROJECT_STRUCTURE.md  # Detailed file documentation
└── README.md             # This file
```

**See `PROJECT_STRUCTURE.md` for complete directory breakdown & file purposes.**

---

## 🏗️ Architecture

### Data Flow: Survey → Prediction → Results

```
User Survey (Frontend)
    ↓
POST /api/survey/submit (Backend)
    ↓
Validation + Background Checks
    ↓
POST /api/predict (ML Service)
    ├─ Preprocess responses
    ├─ Call model.predict()
    ├─ Generate SHAP explanations
    └─ Return hesitancy_score + factors
    ↓
Store in MongoDB
    ↓
Render Results (Frontend)
    ├─ Visual gauge (0-100)
    ├─ SHAP factor breakdown
    ├─ Doctor-curated myths
    └─ Action links
```

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                     │
│     HTML/CSS/JS - Responsive, Multilingual              │
└─────────────────────────────────────────────────────────┘
                           ↕ (REST API)
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)               │
│  Routes → Controllers → Services → MongoDB              │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              ML Service (Python/Flask)                    │
│     Model Predictions + SHAP Explanations               │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│         MongoDB (Collections: users, surveys,            │
│          results, myths, institutions, etc.)            │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Database Models

### Collections
- **users** — Individual, Doctor, Institution, Admin accounts
- **surveys** — Survey responses + background validation flags
- **results** — Hesitancy scores + SHAP factors
- **myths** — Doctor-contributed myth-busting content
- **institutions** — Organization accounts + API keys
- **uploads** — CSV uploads + aggregated analysis
- **audit_logs** — Compliance trail (DPDP, regulatory)

See `docs/design/DATABASE_SCHEMA.md` for detailed schemas.

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/survey/submit` | POST | Submit survey responses |
| `/api/results/:resultId` | GET | Fetch results + SHAP factors |
| `/api/myths` | GET | List approved myths |
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login (JWT) |
| `/api/institutional/upload` | POST | Upload population CSV |
| `/api/institutional/analysis/:id` | GET | Get analysis results |
| `/api/doctor/submit-myth` | POST | Submit myth-busting content |
| `/api/admin/queue/institutions` | GET | Pending institution approvals |
| `/api/predict` | POST | ML prediction (internal) |

**Full API docs:** See `docs/api/API_SPECIFICATION.md`

---

## 🧠 ML Model Details

### Training
- **Data Source:** CSV files from `../datasets/`
- **Algorithm:** Gradient Boosting Classifier (scikit-learn)
- **Interpretability:** SHAP TreeExplainer
- **Features:** Demographics, prior experience, attitudes → Binary hesitancy classification
- **Performance:** Accuracy, Precision, Recall, F1-Score, ROC-AUC

### Training Script
```bash
python ml_service/src/train_model.py
# Loads CSV→Preprocesses→Trains→Saves model + explainer
```

### Prediction Output
```json
{
  "hesitancy_score": 42,
  "hesitancy_tier": "Mildly Hesitant",
  "shap_factors": [
    {
      "factor": "worry_ingredients",
      "influence_percentage": 45,
      "explanation": "Your concerns about vaccine ingredients are a major factor..."
    }
  ],
  "validation": {
    "passed": true,
    "flags": [],
    "risk_score": 0
  }
}
```

---

## 🔒 Security & Compliance

### Privacy (DPDP Act 2023)
- ✅ No PII stored without explicit consent
- ✅ Data minimization — only necessary fields collected
- ✅ Anonymisation — survey responses stripped before use
- ✅ Right to deletion — users can request data removal
- ✅ Audit trail — all actions logged for 5 years

### Data Protection
- ✅ Passwords: bcrypt hashing (12 rounds)
- ✅ Transport: HTTPS only
- ✅ Authentication: JWT tokens (1-hour expiry)
- ✅ Authorization: Role-based access control
- ✅ Validation: Input sanitization, rate limiting

### Doctor Verification
- ✅ NMC registration cross-check
- ✅ Content review queue
- ✅ Public accountability (doctor name visible)

---

## 📊 Development Phases

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1 | Weeks 1-2 | Landing page, Survey, Results page |
| 2 | Weeks 3-4 | Auth, Results enhancement, ML integration |
| 3 | Weeks 5-6 | Institutional portal, CSV analysis |
| 4 | Weeks 7-8 | Doctor portal, Content management |
| 5 | Weeks 9-10 | Admin panel, Audit logging |
| 6 | Weeks 11-12 | Testing, Security audit, Deployment |

---

## 🧪 Testing

### Run Tests
```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration

# ML Service tests
cd ml_service
pytest tests/
```

### Manual Testing
1. **Individual Flow:** Survey → Results → Share
2. **Institutional Flow:** Upload CSV → Analysis → Export PDF
3. **Doctor Flow:** Submit myth → Admin approval → Publish
4. **Admin Flow:** Approve institutions → Review flags → Generate audit report

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **SRS.md** | Complete requirements specification |
| **PROJECT_STRUCTURE.md** | File structure & purposes |
| **docs/api/API_SPECIFICATION.md** | Full endpoint documentation |
| **docs/design/ARCHITECTURE.md** | System design & data flow |
| **docs/design/DATABASE_SCHEMA.md** | MongoDB collections in detail |
| **docs/deployment/DEPLOYMENT_GUIDE.md** | Production deployment steps |

---

## 🚢 Deployment

### Using Docker Compose
```bash
docker-compose up -d
# Starts: backend, frontend, ml_service, mongodb
```

### Manual Deployment
1. **Database:** Set up MongoDB Atlas cluster
2. **Backend:** Deploy to Heroku/AWS Lambda
3. **ML Service:** Deploy as separate container
4. **Frontend:** Deploy to Vercel/Netlify or S3 + CloudFront

See `docs/deployment/DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 🛠️ Development Guidelines

- **Code Style:** Follow ESLint (backend) & PEP 8 (ML)
- **Commits:** Semantic versioning + descriptive messages
- **PRs:** Require code review + test coverage
- **Docs:** Update docs/ with feature changes

See `docs/CONTRIBUTING.md` for full guidelines.

---

## 📋 Checklist for First-Time Setup

- [ ] Clone repository
- [ ] Install Node.js & Python dependencies
- [ ] Create `.env` files from `.env.example`
- [ ] Set up MongoDB connection string
- [ ] Train ML model: `python ml_service/src/train_model.py`
- [ ] Start all services (3 terminals)
- [ ] Test: Open browser → http://localhost:3000
- [ ] Take a survey → View results
- [ ] Check admin panel → http://localhost:3000/admin-panel.html

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/xyz`
3. Make changes + write tests
4. Commit: `git commit -m "Add xyz feature"`
5. Push & create Pull Request

---

## 📞 Support & Feedback

- **Issues:** Report bugs via GitHub Issues
- **Discussions:** Use GitHub Discussions for feature requests
- **Email:** [contact@vaccinehesitancy.in](mailto:contact@vaccinehesitancy.in)

---

## 📄 License

MIT License — See LICENSE file for details

---

## 🎓 Credits

- **Patent:** Based on patented methodology for vaccine hesitancy assessment
- **Medical Advisors:** [List of advisors]
- **Contributors:** [Team members]

---

**Started:** 2026-04-06
**Current Version:** 1.0 (Development)
**Last Updated:** 2026-04-06

---

## For More Details

→ Read **SRS.md** for complete requirements
→ See **PROJECT_STRUCTURE.md** for file breakdown
→ Check **docs/** for architecture & deployment

