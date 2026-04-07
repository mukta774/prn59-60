"""
Model Training Script
Trains hesitancy prediction model using provided CSV data
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import shap
import joblib
import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HesitancyModelTrainer:
    """Train and export SHAP-interpretable Logistic Regression baseline model"""

    def __init__(self, data_path='../data/raw'):
        self.data_path = data_path
        self.model = None
        self.explainer = None
        self.scaler = None
        self.encoders = {}
        self.feature_names = []
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None

    def load_and_prepare_data(self):
        """Load CSV files and prepare training data"""
        logger.info("Loading data from CSV files...")

        try:
            # Look for CSV files with health/hesitancy-related data
            data_files = []
            for root, dirs, files in os.walk(self.data_path):
                for file in files:
                    if file.endswith('.csv'):
                        data_files.append(os.path.join(root, file))

            if not data_files:
                logger.warning(f"No CSV files found in {self.data_path}")
                logger.info("Using synthetic data instead...")
                return self.generate_synthetic_data()

            logger.info(f"Found {len(data_files)} CSV file(s)")

            # Load first dataset (or combine multiple if needed)
            df = pd.read_csv(data_files[0])
            logger.info(f"Loaded data shape: {df.shape}")
            logger.info(f"Columns: {list(df.columns)}")

            return self.process_dataset(df)

        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return self.generate_synthetic_data()

    def process_dataset(self, df):
        """Process raw dataset for modeling"""
        logger.info("Processing dataset...")

        # Handle missing values
        df = df.dropna(subset=[df.columns[0]])  # Remove rows with missing target

        # For healthcare datasets, create hesitancy target based on available features
        if 'target' in df.columns:
            target_col = 'target'
        elif 'label' in df.columns:
            target_col = 'label'
        elif 'outcome' in df.columns:
            target_col = 'outcome'
        else:
            # Create synthetic target based on pattern
            logger.info("Creating synthetic hesitancy target...")
            y = self.create_synthetic_target(df)
        else:
            y = df[target_col]
            y = (y > y.median()).astype(int)

        # Select features - use numeric and categorical columns
        X = df.drop(columns=[target_col], errors='ignore')

        # Encode categorical features
        categorical_cols = X.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            self.encoders[col] = le

        # Handle missing values
        X = X.fillna(X.mean(numeric_only=True))

        logger.info(f"Feature matrix shape: {X.shape}")
        logger.info(f"Target distribution: {pd.Series(y).value_counts().to_dict()}")

        return X, y

    def create_synthetic_target(self, df):
        """Create synthetic hesitancy target based on features"""
        logger.info("Creating synthetic target variable...")

        # Use numeric columns to create a hesitancy score
        numeric_df = df.select_dtypes(include=[np.number])

        if len(numeric_df.columns) == 0:
            logger.warning("No numeric columns found, using random target")
            return np.random.binomial(1, 0.5, len(df))

        # Normalize and create composite score
        normalized = (numeric_df - numeric_df.mean()) / numeric_df.std()
        score = normalized.mean(axis=1)

        # Threshold to create binary classification
        y = (score > score.median()).astype(int)

        return y

    def generate_synthetic_data(self):
        """Generate synthetic hesitancy data for demo"""
        logger.warning("Generating synthetic training data...")

        n_samples = 1000

        # Features representing hesitancy factors
        data = {
            'age_group': np.random.choice(['18-25', '26-35', '36-50', '51-65', '65+'], n_samples),
            'education_level': np.random.choice(['low', 'medium', 'high'], n_samples),
            'employment_status': np.random.choice(['employed', 'unemployed', 'student'], n_samples),
            'trust_doctors': np.random.choice([1, 2, 3, 4, 5], n_samples),
            'concern_side_effects': np.random.choice([1, 2, 3, 4, 5], n_samples),
            'concern_ingredients': np.random.choice([1, 2, 3, 4, 5], n_samples),
            'confidence_approval': np.random.choice([1, 2, 3, 4, 5], n_samples),
            'peer_vaccination_rate': np.random.uniform(0, 1, n_samples),
            'media_exposure': np.random.choice([1, 2, 3, 4, 5], n_samples),
            'prior_vaccination': np.random.choice([0, 1], n_samples),
        }

        X = pd.DataFrame(data)

        # Create target based on features (higher concern = higher hesitancy)
        hesitancy_score = (
            (6 - X['trust_doctors']) * 0.3 +
            X['concern_side_effects'] * 0.2 +
            X['concern_ingredients'] * 0.2 +
            (6 - X['confidence_approval']) * 0.15 +
            X['media_exposure'] * 0.15
        )

        y = (hesitancy_score > hesitancy_score.median()).astype(int)

        logger.info(f"Generated synthetic data: X shape {X.shape}, target distribution {np.bincount(y)}")

        return X, y

    def split_data(self, X, y, test_size=0.2, random_state=42):
        """Split data into train and test"""
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        logger.info(f"Train shape: {self.X_train.shape}, Test shape: {self.X_test.shape}")

    def scale_features(self):
        """Standardize features"""
        self.scaler = StandardScaler()
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        self.feature_names = self.X_train.columns.tolist()

    def train_model(self):
        """Train Logistic Regression baseline model"""
        logger.info("Training Logistic Regression Classifier...")

        self.model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='lbfgs',
            class_weight='balanced'
        )

        self.model.fit(self.X_train_scaled, self.y_train)

        # Predictions
        y_pred = self.model.predict(self.X_test_scaled)
        y_pred_proba = self.model.predict_proba(self.X_test_scaled)

        # Metrics
        accuracy = accuracy_score(self.y_test, y_pred)
        precision = precision_score(self.y_test, y_pred, zero_division=0)
        recall = recall_score(self.y_test, y_pred, zero_division=0)
        f1 = f1_score(self.y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(self.y_test, y_pred_proba[:, 1])

        logger.info(f"Accuracy: {accuracy:.4f}")
        logger.info(f"Precision: {precision:.4f}")
        logger.info(f"Recall: {recall:.4f}")
        logger.info(f"F1-Score: {f1:.4f}")
        logger.info(f"ROC-AUC: {roc_auc:.4f}")

        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'roc_auc': roc_auc
        }

    def create_explainer(self):
        """Create SHAP LinearExplainer for Logistic Regression"""
        logger.info("Creating SHAP explainer...")
        # For linear models like LogisticRegression, use LinearExplainer
        self.explainer = shap.LinearExplainer(
            self.model,
            self.X_train_scaled,
            feature_names=self.feature_names
        )

    def save_model(self, model_dir='./models'):
        """Save model and explainer"""
        os.makedirs(model_dir, exist_ok=True)

        model_path = os.path.join(model_dir, 'hesitancy_model.pkl')
        explainer_path = os.path.join(model_dir, 'hesitancy_explainer.pkl')
        scaler_path = os.path.join(model_dir, 'hesitancy_scaler.pkl')

        joblib.dump(self.model, model_path)
        joblib.dump(self.explainer, explainer_path)
        joblib.dump(self.scaler, scaler_path)

        logger.info(f"Model saved to {model_path}")
        logger.info(f"Explainer saved to {explainer_path}")
        logger.info(f"Scaler saved to {scaler_path}")

    def run(self):
        """Complete training pipeline"""
        logger.info("=" * 50)
        logger.info("Starting Hesitancy Model Training")
        logger.info("=" * 50)

        # Load data
        X, y = self.load_and_prepare_data()

        # Split data
        self.split_data(X, y)

        # Scale features
        self.scale_features()

        # Train model
        metrics = self.train_model()

        # Create explainer
        self.create_explainer()

        # Save model
        self.save_model()

        logger.info("=" * 50)
        logger.info("Training Complete!")
        logger.info("=" * 50)

        return metrics


if __name__ == '__main__':
    trainer = HesitancyModelTrainer(data_path='../../datasets')
    metrics = trainer.run()
    print("\nFinal Metrics:")
    for metric, value in metrics.items():
        print(f"  {metric}: {value:.4f}")
