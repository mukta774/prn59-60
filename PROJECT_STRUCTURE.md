# Project Structure Documentation
## Vaccine Hesitancy Assessment & Response System

**Created:** 2026-04-06
**Version:** 1.0
**Full Stack:** HTML/CSS/JavaScript (Frontend) + Node.js/Express.js (Backend) + Python/ML (ML Service) + MongoDB (Database)

---

## Directory Structure

```
vaccine-hesitancy-system/
│
├── backend/
│   ├── src/
│   │   ├── server.js                    # Main Express server entry point
│   │   ├── models/
│   │   │   └── index.js                 # MongoDB Mongoose schemas (User, Survey, Result, Myth, etc.)
│   │   ├── routes/
│   │   │   ├── surveyRoutes.js          # POST /survey/submit, GET /survey/:id
│   │   │   ├── resultsRoutes.js         # GET /results/:resultId
│   │   │   ├── mythsRoutes.js           # GET /myths, listing doctor-approved content
│   │   │   ├── authRoutes.js            # POST /auth/register, /auth/login
│   │   │   ├── institutionalRoutes.js   # POST /institutional/upload, analysis endpoints
│   │   │   ├── doctorRoutes.js          # POST /doctor/submit-myth, GET /doctor/submissions
│   │   │   └── adminRoutes.js           # Admin approval queues, audit logs
│   │   ├── controllers/                 # Business logic for each route
│   │   ├── middleware/                  # Auth, validation, error handling
│   │   ├── services/                    # External API calls, SHAP service, email
│   │   ├── utils/                       # Helpers: validators, CSV parsers, JWT handlers
│   │   ├── validation/                  # Joi/express-validator schemas
│   │   ├── uploads/                     # Temporary CSV uploads folder
│   │   └── logs/                        # Application logs
│   ├── tests/
│   │   ├── unit/                        # Unit tests for utilities, validators
│   │   └── integration/                 # API endpoint tests
│   ├── package.json                     # Node.js dependencies
│   ├── .env.example                     # Environment variables template
│   └── .gitignore                       # Exclude node_modules, .env, logs
│
├── frontend/
│   ├── public/
│   │   ├── index.html                   # Landing page hero section
│   │   ├── individual-assessment.html   # Survey page (12-15 questions)
│   │   ├── results.html                 # Results page with gauge + SHAP factors
│   │   ├── institutional-login.html     # Institution login / registration
│   │   ├── institutional-dashboard.html # CSV upload & analysis dashboard
│   │   ├── doctor-portal.html           # Doctor myth submission form
│   │   ├── admin-panel.html             # Admin approvals & moderation
│   │   ├── styles.css                   # Global styling (responsive, WCAG compliant)
│   │   ├── script.js                    # Common utilities, API calls
│   │   ├── survey.js                    # Survey logic, validation, local storage
│   │   ├── results.js                   # Results visualization (charts, SHAP display)
│   │   └── images/                      # Icons, logos, illustrations
│   ├── src/
│   │   ├── components/                  # Reusable components (if using JS framework)
│   │   ├── services/                    # API service calls
│   │   └── utils/                       # Frontend utilities
│   └── .env.example                     # Frontend env: API_URL, etc.
│
├── ml_service/
│   ├── src/
│   │   ├── app.py                       # Flask API server
│   │   │                                 # Endpoints: /api/predict, /api/model/info
│   │   ├── train_model.py               # Model training script
│   │   │                                 # Loads CSV from ../../datasets/
│   │   │                                 # Trains GradientBoosting + SHAP explainer
│   │   ├── evaluate.py                  # Model evaluation metrics
│   │   └── utils.py                     # Helper functions (preprocessing, encoding)
│   ├── notebooks/                       # Jupyter notebooks for exploration
│   ├── data/
│   │   ├── raw/                         # Raw CSV files from datasets/
│   │   └── processed/                   # Feature-engineered data
│   ├── models/                          # Saved models (.pkl files)
│   │   ├── hesitancy_model.pkl          # Trained GradientBoosting model
│   │   ├── hesitancy_explainer.pkl      # SHAP TreeExplainer
│   │   └── hesitancy_scaler.pkl         # StandardScaler for normalization
│   ├── requirements.txt                 # Python dependencies
│   └── .env.example                     # ML service environment: PORT=8000, etc.
│
├── config/
│   ├── database.js                      # MongoDB connection config
│   ├── passport.js                      # JWT/OAuth strategy (optional)
│   └── nodemailer.js                    # Email service config for notifications
│
├── docs/
│   ├── api/
│   │   └── API_SPECIFICATION.md         # Full API endpoint documentation
│   ├── design/
│   │   ├── ARCHITECTURE.md              # System design & data flow
│   │   ├── DATABASE_SCHEMA.md           # MongoDB collections in detail
│   │   └── UI_WIREFRAMES.md             # UI mockups and flows
│   ├── deployment/
│   │   ├── DEPLOYMENT_GUIDE.md          # Docker, Heroku, AWS setup
│   │   ├── DPDP_COMPLIANCE.md           # Privacy & compliance procedures
│   │   └── MONITORING.md                # Logging, monitoring, alerting
│   └── CONTRIBUTING.md                  # Development guidelines
│
├── .github/
│   └── workflows/
│       ├── test.yml                     # CI: Run tests on every push
│       └── deploy.yml                   # CD: Deploy on release
│
├── docker-compose.yml                   # Orchestrate backend, frontend, ml, mongodb
├── Dockerfile                           # Backend containerization
├── .gitignore                           # Version control exclusions
├── README.md                            # Project overview & quick start
├── SRS.md                               # Software Requirements Specification (THIS FILE)
├── project-setup.sh                     # Script to create directory structure
└── package.json                         # Root-level monorepo config (optional)
```

---

## Key Files & Their Purposes

### Backend Files
| File | Purpose |
|------|---------|
| `backend/src/server.js` | Express app, middleware setup, route registration |
| `backend/src/models/index.js` | MongoDB schemas for all data entities |
| `backend/src/routes/*.js` | API endpoint handlers |
| `backend/.env.example` | Template for environment variables |
| `backend/package.json` | Node.js dependencies (express, mongoose, multer, etc.) |

### Frontend Files
| File | Purpose |
|------|---------|
| `frontend/public/index.html` | Landing page with CTA buttons |
| `frontend/public/individual-assessment.html` | Survey form (12-15 questions) |
| `frontend/public/results.html` | Results visualization + myth-busting content |
| `frontend/public/styles.css` | Responsive styling, dark mode support |
| `frontend/public/survey.js` | Survey logic, validation, progress tracking |
| `frontend/public/results.js` | Chart rendering, SHAP visualization |

### ML Service Files
| File | Purpose |
|------|---------|
| `ml_service/src/app.py` | Flask API: `/api/predict` for hesitancy scores |
| `ml_service/src/train_model.py` | Load CSV → Train model → Save SHAP explainer |
| `ml_service/requirements.txt` | Python deps (scikit-learn, shap, flask, pandas) |
| `ml_service/models/*.pkl` | Saved model & explainer files |

### Configuration Files
| File | Purpose |
|------|---------|
| `.env.example` | Template showing all required env vars |
| `docker-compose.yml` | Multi-container orchestration |
| `.gitignore` | Exclude sensitive files from git |

### Documentation Files
| File | Purpose |
|------|---------|
| `SRS.md` | **This file** — Complete requirements specification |
| `docs/api/API_SPECIFICATION.md` | Full endpoint documentation with examples |
| `docs/design/ARCHITECTURE.md` | System design, data flow diagrams |
| `docs/deployment/DEPLOYMENT_GUIDE.md` | How to deploy to production |

---

## Data Flow Overview

### Survey → Prediction → Results

```
1. USER fills survey (individual-assessment.html)
   ↓
2. Frontend validates responses (survey.js)
   ↓
3. POST /api/survey/submit (backend)
   ↓
4. Backend calls ML service: POST /api/predict (ml_service/app.py)
   ↓
5. ML service preprocesses + calls model.predict()
   ↓
6. SHAP explainer generates factor breakdown
   ↓
7. Results stored in MongoDB
   ↓
8. Response with hesitancy_score + shap_factors
   ↓
9. Frontend renders results.html with gauge + myths
```

### Institutional CSV Upload Flow

```
1. Institution uploads CSV (institutional-dashboard.html)
   ↓
2. POST /api/institutional/upload (backend)
   ↓
3. Backend validates CSV structure + quality
   ↓
4. For each row: call ML service /api/predict
   ↓
5. Aggregate results: mean, distribution, heatmap
   ↓
6. Generate SHAP factor heatmap by demographics
   ↓
7. Store aggregated results in MongoDB (Upload collection)
   ↓
8. Auto-delete raw CSV after 24 hours
   ↓
9. Return analysis dashboard with charts & recommendations
```

---

## Environment Setup

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vaccine_hesitancy
JWT_SECRET=your_secret_key
ML_SERVICE_URL=http://localhost:8000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_URL=http://localhost:8000/api
```

### ML Service (.env)
```
FLASK_ENV=development
PORT=8000
MODEL_PATH=./models/hesitancy_model.pkl
DATA_PATH=../../datasets
```

---

## Development Workflow

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install

# ML Service
cd ml_service && pip install -r requirements.txt
```

### 2. Train ML Model
```bash
cd ml_service/src
python train_model.py
# Trains on CSV files from ../../datasets/
# Saves model, explainer, scaler to ./models/
```

### 3. Start Services (Terminal 1: Backend)
```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

### 4. Start Services (Terminal 2: ML Service)
```bash
cd ml_service/src
python app.py
# Starts on http://localhost:8000
```

### 5. Open Frontend (Terminal 3)
```bash
# Simply open frontend/public/index.html in browser
# Or use: python -m http.server 3000 --directory frontend/public
```

---

## Database Collections Structure

### users
```json
{
  "_id": "uuid",
  "email": "user@example.com",
  "password_hash": "bcrypt_hash",
  "role": "individual|doctor|institution|admin",
  "verified": true,
  "profile": { "name": "...", "nmc_registration": "..." },
  "created_at": "2026-04-06T10:00:00Z"
}
```

### surveys
```json
{
  "_id": "uuid",
  "responses": {
    "demographics": { "age": "26-35", "education": "high" },
    "prior_experience": { "vaccination_history": "yes" },
    "attitudes": { "trust_doctors": 4, "worry_ingredients": 2 }
  },
  "validation": { "passed": true, "flags": [], "risk_score": 0 },
  "created_at": "2026-04-06T10:00:00Z"
}
```

### results
```json
{
  "_id": "uuid",
  "survey_id": "uuid_ref",
  "hesitancy_score": 42,
  "tier": "Mildly Hesitant",
  "shap_factors": [
    { "factor": "worry_ingredients", "influence_percentage": 45, "explanation": "..." }
  ],
  "recommended_myths": ["myth_id_1", "myth_id_2"],
  "contribute_anonymised": true
}
```

### myths
```json
{
  "_id": "uuid",
  "doctor_id": "uuid_ref",
  "concern": "Vaccines cause infertility",
  "response": "No evidence supports this claim...",
  "status": "published",
  "published_at": "2026-03-15T00:00:00Z",
  "view_count": 1234
}
```

---

## API Endpoints Summary

**Survey:** POST /api/survey/submit, GET /api/results/:resultId
**Myths:** GET /api/myths
**Auth:** POST /api/auth/register, POST /api/auth/login
**Institutional:** POST /api/institutional/upload, GET /api/institutional/analysis/:uploadId
**Doctor:** POST /api/doctor/submit-myth, GET /api/doctor/submissions
**Admin:** GET /api/admin/queue/institutions, POST /api/admin/approve-institution/:id, etc.
**ML Service:** POST /api/predict (returns hesitancy_score + shap_factors)

---

## Testing

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

---

## Deployment

See `docs/deployment/DEPLOYMENT_GUIDE.md` for:
- Docker containerization
- Heroku / AWS / GCP deployment
- MongoDB Atlas setup
- Environment configuration
- CI/CD pipeline setup

---

## Dependencies Overview

### Backend (Node.js)
- **Express.js** — Web framework
- **Mongoose** — MongoDB ORM
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT authentication
- **multer** — File uploads (CSV)
- **csv-parse** — CSV parsing
- **axios** — HTTP calls to ML service
- **winston** — Logging

### Frontend (HTML/CSS/JS)
- **Chart.js** — Charts for results
- **Fetch API** — API calls
- **Chart.js SHAP plugin** — SHAP visualization (future)

### ML Service (Python)
- **Flask** — Web framework
- **scikit-learn** — ML algorithms
- **XGBoost** — Gradient boosting model
- **SHAP** — Model interpretability
- **pandas** — Data processing
- **joblib** — Model serialization

---

## Next Steps

1. ✅ **Project structure created** — All folders ready
2. ✅ **Database schema defined** — MongoDB models in `backend/src/models/index.js`
3. ✅ **API routes stubbed** — All endpoints created
4. ✅ **Frontend pages created** — Landing, Survey, Results pages
5. ✅ **ML training script** — Uses CSV data from datasets/
6. ⏭ **Phase 1 Development:**
   - Implement survey validation logic
   - Connect frontend to backend API
   - Test SHAP predictions
7. ⏭ **Phase 2:** User authentication + institutional features
8. ⏭ **Phase 3:** Doctor portal + content management
9. ⏭ **Phase 4:** Admin panel + compliance features

---

**For Questions:** Refer to SRS.md or docs/ folder
**To Start:** Run `npm install` in backend, `pip install` in ml_service, then `npm run dev`

