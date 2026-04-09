# ML Integration Guide - Baseline Model

**Status:** ✅ Ready for Integration
**Model:** Logistic Regression (Baseline)
**API Pattern:** REST API on Flask

---

## 🚀 Quick Start

### 1. Train the Model

```bash
cd ml_service
python src/train_model.py
```

**Output:**
- `models/hesitancy_model.pkl` - Trained classifier
- `models/hesitancy_explainer.pkl` - SHAP explainer
- `models/hesitancy_scaler.pkl` - Feature scaler

**Training takes:** ~30 seconds (synthetic data)

### 2. Start ML Service

```bash
# From ml_service directory
python src/app.py
# Server runs on http://localhost:5000
```

### 3. Integrate with Frontend

Update `frontend/public/results.js` to call the API instead of client-side calculation.

---

## 📊 Survey Response Format

The survey collects 15 questions across 3 sections:

### Questions & Mappings

| Q# | Type | Feature Name | Example Answer |
|----|------|--------------|-----------------|
| 1 | Age group | age_group | "26-35" |
| 2 | Gender | gender | "male" |
| 3 | Education | education_level | "bachelor" |
| 4 | Health conditions | health_conditions | "yes" / "no" |
| 5 | Vaccination status | vaccination_status | "fully" / "partially" / "not_vaccinated" |
| 6 | Side effects experienced | side_effects_experienced | "yes" / "no" |
| 7 | COVID experience | covid_experience | "yes" / "no" |
| 8 | Allergies | allergies | "yes" / "no" |
| 9 | Doctor discussions | doctor_discussions | "yes" / "no" |
| 10 | Info sources | info_sources | "yes" / "no" |
| 11 | Recent research | recent_research | "yes" / "no" |
| 12 | Trust in authorities | trust_authorities | 1-5 (Likert) |
| 13 | Vaccine concerns | vaccine_concerns | 1-5 (Likert) |
| 14 | Vaccine effectiveness | vaccine_effectiveness | 1-5 (Likert) |
| 15 | Vaccination intent | vaccination_intent | "definitely_yes", "probably_yes", "unsure", "probably_no", "definitely_no" |

### localStorage Format (Current)

```json
{
  "responses": [
    {"q": 1, "answer": "26-35"},
    {"q": 2, "answer": "male"},
    ...
    {"q": 15, "answer": "probably_yes"}
  ],
  "timestamp": "2026-04-07T10:30:00Z"
}
```

---

## 🔌 API Endpoint

### POST `/api/v1/predict`

**Request:**
```json
{
  "responses": [
    {"q": 1, "answer": "26-35"},
    {"q": 2, "answer": "male"},
    {"q": 3, "answer": "bachelor"},
    {"q": 4, "answer": "no"},
    {"q": 5, "answer": "fully"},
    {"q": 6, "answer": "no"},
    {"q": 7, "answer": "yes"},
    {"q": 8, "answer": "no"},
    {"q": 9, "answer": "yes"},
    {"q": 10, "answer": "yes"},
    {"q": 11, "answer": "yes"},
    {"q": 12, "answer": "4"},
    {"q": 13, "answer": "2"},
    {"q": 14, "answer": "5"},
    {"q": 15, "answer": "definitely_yes"}
  ]
}
```

**Response:**
```json
{
  "score": 28,
  "tier": "mildly_hesitant",
  "probability": 0.28,
  "factors": [
    {
      "name": "Vaccine Concerns",
      "importance": 35.2,
      "explanation": "Concerns about vaccine safety are a major factor in your assessment."
    },
    {
      "name": "Trust Authorities",
      "importance": 28.5,
      "explanation": "Your trust level in health authorities significantly influences your hesitancy score."
    },
    {
      "name": "Vaccine Effectiveness",
      "importance": 24.1,
      "explanation": "Your belief in vaccine effectiveness is a key driver of your score."
    }
  ],
  "validation": {
    "passed": true,
    "flags": [],
    "risk_level": "low"
  }
}
```

---

## 💻 Frontend Integration

### Option 1: Replace Score Calculation (Recommended)

In `results.js`, replace the `calculateScoreFromResponses()` call:

**Before:**
```javascript
function initializeResults() {
    const assessmentData = JSON.parse(localStorage.getItem('assessment_data'));

    if (assessmentData) {
        // Calculate score locally (rule-based)
        calculateScoreFromResponses(assessmentData.responses);
        displayResults();
    }
}
```

**After:**
```javascript
async function initializeResults() {
    const assessmentData = JSON.parse(localStorage.getItem('assessment_data'));

    if (assessmentData) {
        try {
            // Fetch ML prediction from API
            const mlResult = await fetchMLPrediction(assessmentData.responses);

            // Use ML result
            hesitancyScore = mlResult.score;
            hesitancyTier = mlResult.tier;
            mlFactors = mlResult.factors;

            displayResults();
        } catch (error) {
            console.error('ML API error, falling back to rule-based:', error);
            // Fallback to rule-based calculation
            calculateScoreFromResponses(assessmentData.responses);
            displayResults();
        }
    }
}

async function fetchMLPrediction(responses) {
    const response = await fetch('http://localhost:5000/api/v1/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responses })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
}
```

### Option 2: Add ML Results Display

Create a new function to display ML-specific factors:

```javascript
function displayMLFactors(factors) {
    const container = document.getElementById('factors-container');
    container.innerHTML = '';

    factors.forEach((factor, index) => {
        const factorCard = document.createElement('div');
        factorCard.className = 'factor-card';
        factorCard.innerHTML = `
            <div class="factor-rank">#${index + 1}</div>
            <div class="factor-name">${factor.name}</div>
            <div class="factor-importance">
                <div class="importance-bar">
                    <div class="importance-fill" style="width: ${factor.importance}%"></div>
                </div>
                <div class="importance-percent">${factor.importance.toFixed(1)}%</div>
            </div>
            <div class="factor-explanation">${factor.explanation}</div>
        `;
        container.appendChild(factorCard);
    });
}
```

---

## 🧪 Testing the Integration

### 1. Test API Directly

```bash
curl -X POST http://localhost:5000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "responses": [
      {"q": 1, "answer": "26-35"},
      {"q": 2, "answer": "male"},
      {"q": 3, "answer": "bachelor"},
      {"q": 4, "answer": "no"},
      {"q": 5, "answer": "fully"},
      {"q": 6, "answer": "no"},
      {"q": 7, "answer": "yes"},
      {"q": 8, "answer": "no"},
      {"q": 9, "answer": "yes"},
      {"q": 10, "answer": "yes"},
      {"q": 11, "answer": "yes"},
      {"q": 12, "answer": "4"},
      {"q": 13, "answer": "2"},
      {"q": 14, "answer": "5"},
      {"q": 15, "answer": "definitely_yes"}
    ]
  }'
```

### 2. Test in Browser Console

```javascript
// Fill survey and submit
// Open results page

// In browser console:
const responses = JSON.parse(localStorage.getItem('assessment_data')).responses;

fetch('http://localhost:5000/api/v1/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responses })
})
.then(r => r.json())
.then(data => console.log('ML Result:', data));
```

---

## 🔄 Model Comparison

### Rule-Based (Current) vs ML (New)

| Aspect | Rule-Based | ML Baseline |
|--------|-----------|------------|
| Score Calculation | Fixed weights | Learned weights |
| Factor Selection | Hardcoded | Data-driven |
| Interpretability | Transparent | SHAP explanations |
| Accuracy | N/A | ~75-80% accuracy |
| Training Time | N/A | ~30 seconds |
| Latency | <1ms | ~50ms |
| Update Frequency | Manual | Can retrain |

### Prediction Example

**Input:** User with high trust, low concerns, vaccinated

**Rule-Based:**
- Trust (Q12=4) → 25
- Concerns (Q13=1) → 20
- Effectiveness (Q14=5) → 20
- Intent (Q15=definitely_yes) → 15
- Status (Q5=fully) → 20
- **Average: 20** (Confident)

**ML (Baseline):**
- Learned that trust is 40% important, concerns 30%, others 30%
- **Score: 22** (Confident, slight variation due to feature interactions)

---

## ⚙️ Configuration

### Environment Variables

Create `.env` in `ml_service/` directory:

```env
FLASK_ENV=development
LOG_LEVEL=INFO
PORT=5000
MODEL_PATH=./models/hesitancy_model.pkl
EXPLAINER_PATH=./models/hesitancy_explainer.pkl
SCALER_PATH=./models/hesitancy_scaler.pkl
```

### CORS Configuration

ML Service allows requests from:
- `http://localhost:3000` (frontend local dev)
- Can be restricted in production

---

## 🐛 Debugging

### Check Model Loading

```bash
python -c "import joblib; m = joblib.load('models/hesitancy_model.pkl'); print('Model loaded:', m)"
```

### Test Feature Preprocessing

```python
from app import preprocess_survey_responses

responses = [
    {"q": 1, "answer": "26-35"},
    # ... all 15 questions
]

features = preprocess_survey_responses(responses)
print("Features:", features)
```

### View SHAP Values

```python
import joblib
import numpy as np

model = joblib.load('models/hesitancy_model.pkl')
explainer = joblib.load('models/hesitancy_explainer.pkl')
scaler = joblib.load('models/hesitancy_scaler.pkl')

# Sample prediction
features = [...]  # Your features
features_scaled = scaler.transform([features])
shap_values = explainer.shap_values(features_scaled)
print("SHAP Values:", shap_values)
```

---

## 📈 Next Steps (After Baseline)

1. **Collect Real Data**
   - Deploy current system
   - Collect 100+ real survey responses
   - Retrain with real data

2. **Upgrade to Advanced Models**
   - Try Gradient Boosting (better accuracy)
   - Try Neural Networks (higher complexity)
   - A/B test predictions

3. **Enhance Features**
   - Add interaction features
   - Time-based features (when response was collected)
   - Geographic features (if available)

4. **Improve Explainability**
   - Use more detailed SHAP visualizations
   - Add feature contribution breakdowns
   - Create individual-level explanations

---

## 📞 Troubleshooting

### "Model not loaded" Error

**Issue:** `/api/v1/predict` returns 503

**Solution:**
```bash
# Check files exist
ls -la ml_service/models/

# Retrain if missing
python ml_service/src/train_model.py
```

### CORS Error

**Issue:** Browser blocks request from `http://localhost:3000`

**Solution:** Already configured with `flask_cors`. If issue persists:
```python
# In app.py
CORS(app, origins=['http://localhost:3000', 'http://localhost:8000'])
```

### Feature Mismatch

**Issue:** "ValueError: X has 10 features but model expects 15"

**Solution:** Check `preprocess_survey_responses()` returns all 15 features

---

## 📚 References

- [SHAP Documentation](https://shap.readthedocs.io/)
- [Logistic Regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)
- [Flask CORS](https://flask-cors.readthedocs.io/)

---

**Status: ✅ Ready for Immediate Integration**
