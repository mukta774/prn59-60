"""
ML Service Flask API
Handles SHAP-based hesitancy predictions from 15-question survey
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from dotenv import load_dotenv
import joblib
import shap
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Load trained model and SHAP explainer
try:
    MODEL_PATH = os.getenv('MODEL_PATH', './models/hesitancy_model.pkl')
    EXPLAINER_PATH = os.getenv('EXPLAINER_PATH', './models/hesitancy_explainer.pkl')
    SCALER_PATH = os.getenv('SCALER_PATH', './models/hesitancy_scaler.pkl')

    model = joblib.load(MODEL_PATH)
    explainer = joblib.load(EXPLAINER_PATH)
    scaler = joblib.load(SCALER_PATH)
    logger.info("Model, explainer, and scaler loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None
    explainer = None
    scaler = None


# === FEATURE MAPPING FROM 15-QUESTION SURVEY ===
# Maps survey question responses to model features
SURVEY_TO_FEATURES = {
    'Q1_age_group': 'age_group',
    'Q2_gender': 'gender',
    'Q3_education_level': 'education_level',
    'Q4_health_conditions': 'health_conditions',
    'Q5_vaccination_status': 'vaccination_status',
    'Q6_side_effects_experienced': 'side_effects_experienced',
    'Q7_covid_experience': 'covid_experience',
    'Q8_allergies': 'allergies',
    'Q9_doctor_discussions': 'doctor_discussions',
    'Q10_info_sources': 'info_sources',
    'Q11_recent_research': 'recent_research',
    'Q12_trust_authorities': 'trust_authorities',
    'Q13_vaccine_concerns': 'vaccine_concerns',
    'Q14_vaccine_effectiveness': 'vaccine_effectiveness',
    'Q15_vaccination_intent': 'vaccination_intent'
}


@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': pd.Timestamp.now().isoformat()
    }), 200


@app.route('/api/v1/predict', methods=['POST'])
def predict_hesitancy():
    """
    Predict hesitancy score from survey responses

    Expected JSON:
    {
        "responses": [
            {"q": 1, "answer": "26-35"},
            {"q": 2, "answer": "male"},
            ...
            {"q": 15, "answer": "probably_yes"}
        ]
    }
    """
    try:
        if model is None or explainer is None:
            return jsonify({'error': 'Model not loaded'}), 503

        data = request.get_json()
        survey_responses = data.get('responses', [])

        # Convert survey responses to feature vector
        feature_dict = preprocess_survey_responses(survey_responses)
        features_df = pd.DataFrame([feature_dict])

        # Scale features
        features_scaled = scaler.transform(features_df)

        # Make prediction
        prediction_proba = model.predict_proba(features_scaled)[0]
        hesitancy_prob = float(prediction_proba[1])  # Probability of high hesitancy
        hesitancy_score = int(hesitancy_prob * 100)  # Convert to 0-100 scale

        # Generate SHAP explanation
        shap_values = explainer.shap_values(features_scaled)
        factors = generate_shap_factors(shap_values[1], feature_dict, hesitancy_score)

        # Determine tier
        tier = get_hesitancy_tier(hesitancy_score)

        response = {
            'score': hesitancy_score,
            'tier': tier,
            'probability': hesitancy_prob,
            'factors': factors,
            'validation': validate_survey_responses(survey_responses)
        }

        logger.info(f"Prediction successful. Score: {hesitancy_score}, Tier: {tier}")
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 400


def preprocess_survey_responses(survey_responses):
    """Convert 15 survey responses to feature dict"""
    feature_dict = {}

    # Build response dict with Q1-Q15 keys
    responses_by_q = {r['q']: r['answer'] for r in survey_responses}

    # Q1: Age group (encode to numeric)
    q1_age = responses_by_q.get(1, '26-35')
    age_mapping = {'18-25': 1, '26-35': 2, '36-50': 3, '51-65': 4, '65+': 5}
    feature_dict['age_group'] = age_mapping.get(q1_age, 2)

    # Q2: Gender (encode to numeric)
    q2_gender = responses_by_q.get(2, 'other')
    gender_mapping = {'male': 1, 'female': 2, 'other': 3}
    feature_dict['gender'] = gender_mapping.get(q2_gender, 2)

    # Q3: Education (encode to numeric)
    q3_education = responses_by_q.get(3, 'bachelor')
    education_mapping = {'high_school': 1, 'bachelor': 2, 'master': 3, 'phd': 4}
    feature_dict['education_level'] = education_mapping.get(q3_education, 2)

    # Q4: Health conditions (binary)
    feature_dict['health_conditions'] = 1 if responses_by_q.get(4) == 'yes' else 0

    # Q5: Vaccination status (encode to numeric)
    q5_vax = responses_by_q.get(5, 'partially')
    vax_mapping = {'not_vaccinated': 0, 'partially': 1, 'fully': 2}
    feature_dict['vaccination_status'] = vax_mapping.get(q5_vax, 1)

    # Q6-Q11: Binary yes/no questions
    for q_num, feature_name in [
        (6, 'side_effects_experienced'),
        (7, 'covid_experience'),
        (8, 'allergies'),
        (9, 'doctor_discussions'),
        (10, 'info_sources'),
        (11, 'recent_research')
    ]:
        feature_dict[feature_name] = 1 if responses_by_q.get(q_num) == 'yes' else 0

    # Q12: Trust in authorities (Likert 1-5) -> invert for hesitancy
    q12_trust = int(responses_by_q.get(12, 3))
    feature_dict['trust_authorities'] = 6 - q12_trust  # Invert: low trust = high hesitancy signal

    # Q13: Vaccine concerns (Likert 1-5) -> direct mapping
    q13_concerns = int(responses_by_q.get(13, 3))
    feature_dict['vaccine_concerns'] = q13_concerns

    # Q14: Vaccine effectiveness (Likert 1-5) -> invert for hesitancy
    q14_effectiveness = int(responses_by_q.get(14, 3))
    feature_dict['vaccine_effectiveness'] = 6 - q14_effectiveness  # Invert: low belief = high hesitancy signal

    # Q15: Vaccination intent (encode to numeric)
    q15_intent = responses_by_q.get(15, 'unsure')
    intent_mapping = {'definitely_no': 0, 'probably_no': 1, 'unsure': 2, 'probably_yes': 3, 'definitely_yes': 4}
    feature_dict['vaccination_intent'] = intent_mapping.get(q15_intent, 2)

    return feature_dict


def get_hesitancy_tier(score):
    """Determine hesitancy tier from 0-100 score"""
    if score <= 25:
        return 'confident'
    elif score <= 50:
        return 'mildly_hesitant'
    elif score <= 75:
        return 'moderately_hesitant'
    else:
        return 'strongly_hesitant'


def generate_shap_factors(shap_values, feature_dict, hesitancy_score):
    """Generate top 3 SHAP factors with explanations"""
    # Get absolute SHAP values and sort
    abs_shap = np.abs(shap_values)
    top_indices = np.argsort(abs_shap)[-3:][::-1]

    feature_names = list(feature_dict.keys())

    factors = []
    for idx in top_indices:
        if idx < len(feature_names):
            feature_name = feature_names[idx]
            importance_pct = (abs_shap[idx] / np.sum(abs_shap) * 100) if np.sum(abs_shap) > 0 else 0

            factor_info = {
                'name': format_feature_name(feature_name),
                'importance': round(float(importance_pct), 1),
                'explanation': get_factor_explanation(feature_name, hesitancy_score)
            }
            factors.append(factor_info)

    return factors[:3]  # Top 3 factors


def format_feature_name(feature_name):
    """Convert feature name to readable format"""
    return ' '.join(w.title() for w in feature_name.split('_'))


def get_factor_explanation(feature_name, score):
    """Get plain language explanation for each factor"""
    explanations = {
        'trust_authorities': "Your trust level in health authorities significantly influences your hesitancy score.",
        'vaccine_concerns': "Concerns about vaccine safety are a major factor in your assessment.",
        'vaccine_effectiveness': "Your belief in vaccine effectiveness is a key driver of your score.",
        'vaccination_intent': "Your overall vaccination intent strongly impacts your hesitancy level.",
        'age_group': "Age-related factors play a role in your vaccine hesitancy assessment.",
        'vaccination_status': "Your current vaccination status influences your hesitancy score.",
        'side_effects_experienced': "Your past experience with vaccine side effects affects your assessment.",
        'covid_experience': "Your COVID-19 experience impacts your vaccine hesitancy level.",
        'education_level': "Your education level is a contributing factor to your assessment.",
        'gender': "Gender-related factors influence your hesitancy score.",
        'health_conditions': "Your health conditions are a relevant factor in your assessment.",
        'allergies': "Any allergies you reported are considered in your score.",
        'doctor_discussions': "Your discussions with healthcare providers influence your assessment.",
        'info_sources': "The sources of your vaccine information play a role in your hesitancy.",
        'recent_research': "Your recent research into vaccine topics affects your score.",
    }
    return explanations.get(feature_name, "This factor contributes to your hesitancy score.")


def validate_survey_responses(survey_responses):
    """Background integrity validation of survey responses"""
    flags = []

    responses_by_q = {r['q']: r['answer'] for r in survey_responses}

    # Check if all questions answered
    if len(survey_responses) < 15:
        flags.append('incomplete_survey')

    # Check for straight-line pattern in Likert scale questions (Q12-Q14)
    likert_answers = []
    for q in [12, 13, 14]:
        ans = responses_by_q.get(q)
        if ans and ans.isdigit():
            likert_answers.append(int(ans))

    if likert_answers and len(set(likert_answers)) == 1:
        flags.append('straight_line_response_pattern')

    # Check response time would be done on frontend

    return {
        'passed': len(flags) == 0,
        'flags': flags,
        'risk_level': 'low' if len(flags) == 0 else 'medium' if len(flags) == 1 else 'high'
    }


@app.route('/api/v1/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503

    return jsonify({
        'model_type': 'Logistic Regression (Baseline)',
        'n_features': model.n_features_in_,
        'classes': [int(c) for c in model.classes_],
        'last_updated': str(os.path.getmtime(os.getenv('MODEL_PATH', './models/hesitancy_model.pkl')))
    }), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=os.getenv('FLASK_ENV') == 'development', port=port, host='0.0.0.0')

