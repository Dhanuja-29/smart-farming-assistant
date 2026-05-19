import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from joblib import dump

# Sample training data for irrigation needs
# You can expand this with more real-world data
data = {
    'temperature': [25, 30, 35, 28, 32, 27, 38, 22, 29, 33],
    'humidity': [65, 55, 45, 70, 50, 75, 35, 80, 60, 40],
    'rainfall_last_24h': [0, 5, 0, 15, 2, 20, 0, 25, 8, 0],
    'soil_moisture': [60, 50, 30, 75, 45, 80, 20, 85, 55, 35],
    'needs_irrigation': [0, 1, 1, 0, 1, 0, 1, 0, 0, 1]  # 0: No irrigation needed, 1: Needs irrigation
}

# Create DataFrame
df = pd.DataFrame(data)

# Features and target
X = df[['temperature', 'humidity', 'rainfall_last_24h', 'soil_moisture']]
y = df['needs_irrigation']

# Train the model
irrigation_model = RandomForestClassifier(n_estimators=100, random_state=42)
irrigation_model.fit(X, y)

# Save the model
dump(irrigation_model, 'models/irrigation_prediction_model.pkl')