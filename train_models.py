import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib

def train_crop_recommendation_model():
    # Load and prepare crop recommendation data
    data = pd.read_csv('data/crop_training_data.csv')
    X = data.drop('crop', axis=1)
    y = data['crop']
    
    # Train the model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save the model
    joblib.dump(model, 'models/crop_recommendation_model.pkl')
    print("Crop recommendation model trained and saved successfully!")

def train_yield_prediction_model():
    # Load and prepare yield prediction data
    data = pd.read_csv('data/yield_training_data.csv')
    X = data.drop('yield', axis=1)
    y = data['yield']
    
    # Train the model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save the model
    joblib.dump(model, 'models/yield_prediction_model.pkl')
    print("Yield prediction model trained and saved successfully!")

if __name__ == "__main__":
    train_crop_recommendation_model()
    train_yield_prediction_model()