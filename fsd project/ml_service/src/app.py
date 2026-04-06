"""
ML Service Flask API
Handles SHAP-based hesitancy predictions
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

    model = joblib.load(MODEL_PATH)
    explainer = joblib.load(EXPLAINER_PATH)
    logger.info("Model and explainer loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None
    explainer = None


# Survey question to feature mapping
FEATURE_MAP = {
    'age': 'demographics_age',
    'gender': 'demographics_gender',
    'education': 'demographics_education',
    'employment': 'demographics_employment',
    'vax_history': 'prior_exp_vaccination_history',
    'side_effects': 'prior_exp_side_effects',
    'trust_doctors': 'attitude_trust_doctors',
    'confidence_approval': 'attitude_confidence_approval',
    'worry_ingredients': 'attitude_worry_ingredients',
    'peer_influence': 'attitude_peer_influence',
    'media_influence': 'attitude_media_influence'
}


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': pd.Timestamp.now().isoformat()
    }), 200


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Predict hesitancy score and generate SHAP explanations

    Expected JSON:
    {
        "responses": {
            "demographics": {...},
            "prior_experience": {...},
            "attitudes": {...}
        }
    }
    """
    try:
        if model is None or explainer is None:
            return jsonify({'error': 'Model not loaded'}), 503

        data = request.get_json()
        responses = data.get('responses', {})

        # Convert responses to feature vector
        features = preprocess_responses(responses)
        features_df = pd.DataFrame([features])

        # Make prediction
        prediction = model.predict(features_df)[0]
        probability = model.predict_proba(features_df)[0]

        # Generate SHAP explanation
        shap_values = explainer.shap_values(features_df)
        explanation = generate_shap_explanation(shap_values, features, model.feature_names_in_)

        # Determine tier
        tier = get_hesitancy_tier(prediction)

        # Validate response patterns (background integrity check)
        validation = validate_response_patterns(responses)

        response = {
            'hesitancy_score': float(prediction),
            'hesitancy_tier': tier,
            'probability': {
                'class_0': float(probability[0]),
                'class_1': float(probability[1])
            },
            'shap_factors': explanation,
            'validation': validation
        }

        logger.info(f"Prediction successful. Score: {prediction:.2f}")
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 400


def preprocess_responses(responses):
    """Convert survey responses to feature vector"""
    features = {}

    # Demographics
    features['age'] = encode_age(responses.get('demographics', {}).get('age'))
    features['gender'] = encode_categorical(responses.get('demographics', {}).get('gender'))
    features['education'] = encode_categorical(responses.get('demographics', {}).get('education'))
    features['employment'] = encode_categorical(responses.get('demographics', {}).get('employment'))

    # Prior Experience
    features['vax_history'] = 1 if responses.get('prior_experience', {}).get('vaccination_history') == 'yes' else 0
    features['side_effects'] = 1 if responses.get('prior_experience', {}).get('side_effects_experienced') == 'yes' else 0

    # Attitudes (Likert scale 1-5)
    feelings = responses.get('attitudes', {})
    features['trust_doctors'] = feelings.get('trust_doctors', 3)
    features['confidence_approval'] = feelings.get('confidence_approval', 3)
    features['worry_ingredients'] = feelings.get('worry_ingredients', 3)
    features['peer_influence'] = feelings.get('peer_influence', 3)
    features['media_influence'] = feelings.get('media_influence', 3)

    return features


def encode_age(age_str):
    """Encode age group to numeric"""
    age_mapping = {
        '18-25': 1,
        '26-35': 2,
        '36-50': 3,
        '51-65': 4,
        '65+': 5
    }
    return age_mapping.get(age_str, 3)


def encode_categorical(value):
    """Generic categorical encoding"""
    if value is None:
        return 0
    return hash(value) % 256 / 256  # Simple encoding


def get_hesitancy_tier(score):
    """Determine hesitancy tier from score"""
    if score < 25:
        return 'Confident'
    elif score < 50:
        return 'Mildly Hesitant'
    elif score < 75:
        return 'Moderately Hesitant'
    else:
        return 'Strongly Hesitant'


def generate_shap_explanation(shap_values, features, feature_names):
    """Generate top SHAP factors explanation"""
    # Get absolute SHAP values
    abs_shap = np.abs(shap_values[0])

    # Get top 3 features
    top_indices = np.argsort(abs_shap)[-3:][::-1]

    factors = []
    for idx in top_indices:
        factor_name = feature_names[idx]
        influence = abs_shap[idx] / np.sum(abs_shap) * 100

        factors.append({
            'factor': factor_name,
            'influence_percentage': float(influence),
            'explanation': get_factor_explanation(factor_name, influence)
        })

    return factors


def get_factor_explanation(factor_name, influence):
    """Get plain language explanation for factors"""
    explanations = {
        'worry_ingredients': f"Your concerns about vaccine ingredients are a major factor ({influence:.0f}%) in your hesitancy.",
        'trust_doctors': f"Your trust level in doctors influences your hesitancy score ({influence:.0f}%).",
        'side_effects': f"Side effect concerns play a significant role ({influence:.0f}%) in your assessment.",
        'confidence_approval': f"Confidence in approval processes affects your score ({influence:.0f}%).",
        'peer_influence': f"Social and peer influences impact your hesitancy ({influence:.0f}%).",
        'media_influence': f"Media coverage and information sources are a factor ({influence:.0f}%) in your assessment.",
    }
    return explanations.get(factor_name, f"This factor contributes {influence:.0f}% to your score.")


def validate_response_patterns(responses):
    """Background integrity validation"""
    flags = []

    attitudes = responses.get('attitudes', {})

    # Check for straight-line patterns (all same response)
    values = [attitudes.get(k) for k in attitudes if isinstance(attitudes.get(k), (int, float))]
    if values and len(set(values)) == 1:
        flags.append('straight_line_response_pattern')

    # Check for contradictions
    if attitudes.get('trust_doctors', 0) > 3 and attitudes.get('worry_ingredients', 0) > 4:
        flags.append('potential_contradiction_detected')

    return {
        'passed': len(flags) == 0,
        'flags': flags,
        'risk_score': len(flags) * 0.2
    }


@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503

    return jsonify({
        'model_type': type(model).__name__,
        'features': list(model.feature_names_in_),
        'n_features': model.n_features_in_,
        'last_updated': os.path.getmtime(os.getenv('MODEL_PATH', './models/hesitancy_model.pkl'))
    }), 200


@app.route('/api/model/retrain', methods=['POST'])
def retrain_model():
    """Trigger model retraining (admin only)"""
    try:
        logger.info("Model retraining initiated")
        # Call training script
        os.system("python src/train_model.py")
        return jsonify({'status': 'Retraining started'}), 202
    except Exception as e:
        logger.error(f"Retraining failed: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(debug=os.getenv('NODE_ENV') == 'development', port=port, host='0.0.0.0')
