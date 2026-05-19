# from flask import Flask, render_template, request, jsonify
# import pandas as pd
# import numpy as np
# from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
# import joblib
# import requests
# from datetime import datetime, timedelta
# import json
# import os
# import threading
# import time

# # Load environment variables (optional)
# try:
#     from dotenv import load_dotenv
#     load_dotenv()
# except ImportError:
#     print("dotenv not installed, skipping .env loading")
#     pass

# app = Flask(__name__,
#             static_url_path='',
#             static_folder='static',
#             template_folder='templates')

# # Store farmer notifications and active alerts (in-memory database for demonstration)
# farmer_notifications = {}
# active_alerts = {}

# # OpenWeatherMap API configuration
# OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'your_api_key_here')
# WEATHER_API_BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

# # Irrigation thresholds for different crops
# IRRIGATION_THRESHOLDS = {
#     'rice': {
#         'min_soil_moisture': 80,
#         'max_temperature': 35,
#         'min_rainfall': 10,  # mm per day
#         'humidity_threshold': 60
#     },
#     'wheat': {
#         'min_soil_moisture': 60,
#         'max_temperature': 30,
#         'min_rainfall': 5,
#         'humidity_threshold': 50
#     },
#     'maize': {
#         'min_soil_moisture': 65,
#         'max_temperature': 32,
#         'min_rainfall': 7,
#         'humidity_threshold': 55
#     },
#     'cotton': {
#         'min_soil_moisture': 55,
#         'max_temperature': 38,
#         'min_rainfall': 8,
#         'humidity_threshold': 45
#     },
#     'sugarcane': {
#         'min_soil_moisture': 75,
#         'max_temperature': 35,
#         'min_rainfall': 15,
#         'humidity_threshold': 65
#     }
# }

# # Sample weather data for testing
# SAMPLE_WEATHER_DATA = {
#     'mumbai': {'temp': 32, 'humidity': 74, 'description': 'partly cloudy', 'rainfall': 0, 'soil_moisture': 65},
#     'delhi': {'temp': 28, 'humidity': 65, 'description': 'clear sky', 'rainfall': 0, 'soil_moisture': 55},
#     'bangalore': {'temp': 25, 'humidity': 70, 'description': 'light rain', 'rainfall': 5, 'soil_moisture': 75},
# }

# def get_weather_data(location):
#     """Get weather data from OpenWeatherMap API or sample data."""
#     try:
#         # If API key is provided, try OpenWeatherMap first
#         if OPENWEATHER_API_KEY and OPENWEATHER_API_KEY != 'your_api_key_here':
#             try:
#                 params = {
#                     'q': location,
#                     'appid': OPENWEATHER_API_KEY,
#                     'units': 'metric'
#                 }
#                 response = requests.get(WEATHER_API_BASE_URL, params=params, timeout=15)  # Increased timeout
#                 if response.status_code == 200:
#                     data = response.json()
#                     print(f"Weather API response: {data}")  # Log the full API response
#                     # Validate and extract required fields
#                     temperature = data.get('main', {}).get('temp')
#                     humidity = data.get('main', {}).get('humidity')
#                     rainfall = data.get('rain', {}).get('1h', 0) if data.get('rain') else 0

#                     if temperature is not None and humidity is not None:
#                         return {
#                             'temperature': temperature,
#                             'humidity': humidity,
#                             'rainfall': rainfall,
#                             'soil_moisture': 70  # Default soil moisture
#                         }
#                     else:
#                         print("Incomplete weather data received from API.")
#                         print(f"Response data: {data}")  # Log incomplete data
#                 else:
#                     print(f"Weather API error: {response.status_code} - {response.text}")
#             except requests.exceptions.RequestException as api_exc:
#                 print(f"Weather API request error: {api_exc}")

#         # Try sample data by city name
#         if isinstance(location, str) and location.lower() in SAMPLE_WEATHER_DATA:
#             data = SAMPLE_WEATHER_DATA[location.lower()]
#             return {
#                 'temperature': data['temp'],
#                 'humidity': data['humidity'],
#                 'rainfall': data.get('rainfall', 0),
#                 'soil_moisture': data.get('soil_moisture', 70)
#             }

#         # Last-resort default to avoid failing the endpoint
#         return {
#             'temperature': 25.0,
#             'humidity': 60,
#             'rainfall': 0,
#             'soil_moisture': 65
#         }
#     except Exception as e:
#         print(f"Error getting weather data: {str(e)}")
#         return {
#             'temperature': 25.0,
#             'humidity': 60,
#             'rainfall': 0,
#             'soil_moisture': 65
#         }

# def check_irrigation_need(weather_data, crop_type):
#     """Check if irrigation is needed based on weather data and crop thresholds."""
#     if crop_type not in IRRIGATION_THRESHOLDS:
#         return False, "Unknown crop type"
    
#     thresholds = IRRIGATION_THRESHOLDS[crop_type]
    
#     # Extract weather parameters
#     temperature = weather_data.get('temperature', 0)
#     humidity = weather_data.get('humidity', 0)
#     rainfall = weather_data.get('rainfall', 0)
#     soil_moisture = weather_data.get('soil_moisture', 0)
    
#     # Check conditions
#     needs_irrigation = False
#     reasons = []
    
#     if soil_moisture < thresholds['min_soil_moisture']:
#         needs_irrigation = True
#         reasons.append(f"Soil moisture ({soil_moisture}%) is below minimum threshold ({thresholds['min_soil_moisture']}%)")
    
#     if temperature > thresholds['max_temperature']:
#         needs_irrigation = True
#         reasons.append(f"Temperature ({temperature}°C) is above maximum threshold ({thresholds['max_temperature']}°C)")
    
#     if rainfall < thresholds['min_rainfall']:
#         needs_irrigation = True
#         reasons.append(f"Rainfall ({rainfall}mm) is below minimum threshold ({thresholds['min_rainfall']}mm)")
    
#     if humidity < thresholds['humidity_threshold']:
#         needs_irrigation = True
#         reasons.append(f"Humidity ({humidity}%) is below threshold ({thresholds['humidity_threshold']}%)")
    
#     return needs_irrigation, reasons

# @app.route('/')
# def home():
#     return render_template('index.html')

# @app.route('/get_weather', methods=['POST'])
# def get_weather():
#     """Get weather data for a location."""
#     try:
#         data = request.json
#         print(f"Received request data: {data}")  # Log the incoming request data

#         location = data.get('location', '').lower()

#         if not location:
#             return jsonify({
#                 'error': 'Location is required.'
#             }), 400

#         weather_data = get_weather_data(location)
#         print(f"Fetched weather data: {weather_data}")  # Log the fetched weather data

#         if weather_data:
#             # return raw weather_data so frontend can access temperature directly
#             return jsonify(weather_data)
#         else:
#             return jsonify({'error': 'Could not fetch weather data.'}), 404
#     except Exception as e:
#         import traceback
#         traceback.print_exc()  # Log the full traceback for debugging
#         return jsonify({
#             'error': f'Error getting weather data: {str(e)}'
#         }), 500

# @app.route('/recommend_crop', methods=['POST'])
# def recommend_crop():
#     """Recommend suitable crops based on environmental conditions."""
#     try:
#         data = request.json or {}

#         # Helper parser
#         def parse_float(key, default=0.0, required=False):
#             if key not in data or data.get(key) in (None, ""):
#                 if required:
#                     raise ValueError(f"Missing required field: {key}")
#                 return float(default)
#             try:
#                 return float(data.get(key))
#             except Exception:
#                 raise ValueError(f"Invalid numeric value for {key}: {data.get(key)}")

#         temperature = parse_float('temperature', required=True)
#         rainfall = parse_float('rainfall', required=True)
#         soil_ph = parse_float('soil_ph', default=6.5)

#         # Simple rule-based recommendation (fallback to model later)
#         if temperature > 30 and rainfall > 200:
#             recommended_crop = 'rice'
#         elif temperature > 25 and rainfall > 100:
#             recommended_crop = 'maize'
#         elif temperature > 20 and rainfall > 50:
#             recommended_crop = 'wheat'
#         elif temperature > 30 and rainfall < 50:
#             recommended_crop = 'cotton'
#         else:
#             recommended_crop = 'wheat'

#         # build a structured response that matches frontend expectations
#         crop_info = {
#             'rice': {
#                 'description': 'Rice thrives in warm temperatures with abundant water.',
#                 'optimal_temp': 30,
#                 'required_rainfall': 200,
#                 'growing_period': 120
#             },
#             'wheat': {
#                 'description': 'Wheat prefers moderate temperatures and consistent rainfall.',
#                 'optimal_temp': 20,
#                 'required_rainfall': 100,
#                 'growing_period': 110
#             },
#             'maize': {
#                 'description': 'Maize grows well in warmer climates with good rainfall.',
#                 'optimal_temp': 25,
#                 'required_rainfall': 150,
#                 'growing_period': 90
#             },
#             'cotton': {
#                 'description': 'Cotton tolerates heat and requires less rainfall.',
#                 'optimal_temp': 32,
#                 'required_rainfall': 50,
#                 'growing_period': 160
#             }
#         }

#         details = crop_info.get(recommended_crop, {})
#         recommendations = [{
#             'name': recommended_crop,
#             'confidence': 90.0,
#             'description': details.get('description', ''),
#             'optimal_temp': details.get('optimal_temp', 0),
#             'required_rainfall': details.get('required_rainfall', 0),
#             'growing_period': details.get('growing_period', 0)
#         }]

#         return jsonify({'status': 'success', 'recommendations': recommendations})
#     except ValueError as ve:
#         return jsonify({'status': 'error', 'message': str(ve)}), 400
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return jsonify({'status': 'error', 'message': str(e)}), 500

# @app.route('/predict_yield', methods=['POST'])
# def predict_yield():
#     """Predict crop yield based on conditions."""
#     try:
#         data = request.json or {}
#         print("Received data for yield prediction:", data)

#         # Helper to parse floats with clear error messages
#         def parse_float(key, default=0.0, required=False):
#             if key not in data or data.get(key) in (None, ""):
#                 if required:
#                     raise ValueError(f"Missing required field: {key}")
#                 return float(default)
#             try:
#                 return float(data.get(key))
#             except Exception:
#                 raise ValueError(f"Invalid numeric value for {key}: {data.get(key)}")

#         temperature = parse_float('temperature', 0.0, required=True)
#         rainfall = parse_float('rainfall', 0.0, required=True)
#         area = parse_float('area', 0.0, required=True)
#         soil_fertility = str(data.get('soil_fertility', 'medium'))
#         crop = str(data.get('crop', '')).strip().lower()

#         # Infer crop if not provided
#         if not crop:
#             if temperature > 30 and rainfall > 200:
#                 crop = 'rice'
#             elif temperature > 25 and rainfall > 100:
#                 crop = 'maize'
#             elif temperature > 20 and rainfall > 50:
#                 crop = 'wheat'
#             elif temperature > 30 and rainfall < 50:
#                 crop = 'cotton'
#             else:
#                 crop = 'wheat'

#         # Simple yield prediction based on area and conditions
#         base_yields = {
#             'rice': 4.5,  # tons per hectare
#             'wheat': 3.5,
#             'maize': 5.0,
#             'cotton': 2.5,
#             'sugarcane': 70.0
#         }

#         if crop not in base_yields:
#             return jsonify({'status': 'error', 'message': f'No yield prediction available for {crop}'}), 404

#         base_yield = base_yields[crop]

#         # Adjust for rainfall
#         if rainfall < 50:
#             base_yield *= 0.7
#         elif rainfall > 200:
#             base_yield *= 1.2

#         # Adjust for temperature
#         if temperature < 20:
#             base_yield *= 0.8
#         elif temperature > 35:
#             base_yield *= 0.9

#         # Adjust for soil fertility
#         fertility_multipliers = {'low': 0.8, 'medium': 1.0, 'high': 1.2}
#         base_yield *= fertility_multipliers.get(soil_fertility.lower(), 1.0)

#         total_yield = base_yield * area

#         # Construct response according to frontend expectations
#         prediction = {
#             'crop': crop,
#             'yield': float(total_yield),
#             'confidence': 85,  # static confidence for now
#             'roi': 10  # placeholder ROI
#         }
#         return jsonify({'status': 'success', 'predictions': [prediction]})
#     except ValueError as ve:
#         return jsonify({'status': 'error', 'message': str(ve)}), 400
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return jsonify({'status': 'error', 'message': str(e)}), 500

# @app.route('/previous_crops', methods=['POST'])
# def get_previous_crops():
#     """Get historical crop data for visualization."""
#     try:
#         data = request.json or {}
#         location = data.get('location', '').strip().lower()
#         years_to_fetch = int(data.get('years', 5))

#         # fallback structure expected by frontend
#         response = {
#             'status': 'success',
#             'years': [],
#             'crops': [],
#             'yields': [],
#             'location': location
#         }

#         try:
#             df = pd.read_csv('data/historical_crops.csv')
#             if location:
#                 df = df[df['location'].str.lower() == location]

#             # sort by year descending
#             df = df.sort_values(by='year', ascending=False)
#             selected = df.head(years_to_fetch)

#             for _, row in selected.iterrows():
#                 response['years'].append(int(row['year']))
#                 response['crops'].append(row['crop'].lower())
#                 response['yields'].append(float(row['yield']))

#             # if no data for location, return default example values
#             if not response['years']:
#                 # build some dummy data to avoid errors
#                 response['years'] = [datetime.now().year - i for i in range(years_to_fetch)][::-1]
#                 response['crops'] = ['rice'] * years_to_fetch
#                 response['yields'] = [0] * years_to_fetch
#         except Exception as read_exc:
#             print(f"Error reading historical data: {read_exc}")
#             # leave response with empty arrays; frontend will show error
#         return jsonify(response)
#     except Exception as e:
#         return jsonify({
#             'status': 'error',
#             'message': f'Error fetching previous crops: {str(e)}'
#         }), 500

# def monitor_irrigation():
#     """Background task to periodically check irrigation needs."""
#     while True:
#         try:
#             # Check each registered field
#             for farmer_id, fields in active_alerts.items():
#                 for field_index, field_data in enumerate(fields):
#                     # Get weather data
#                     weather_data = get_weather_data(field_data['location'])
#                     if weather_data:
#                         # Check irrigation need
#                         needs_irrigation, reasons = check_irrigation_need(
#                             weather_data, 
#                             field_data['crop_type']
#                         )
                        
#                         if needs_irrigation:
#                             notification = {
#                                 'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
#                                 'field_name': field_data['field_name'],
#                                 'message': 'Irrigation needed',
#                                 'reasons': reasons,
#                                 'weather_data': weather_data
#                             }
                            
#                             if farmer_id not in farmer_notifications:
#                                 farmer_notifications[farmer_id] = []
#                             farmer_notifications[farmer_id].append(notification)
#         except Exception as e:
#             print(f"Error in irrigation monitoring: {str(e)}")
        
#         # Check every 30 minutes
#         time.sleep(1800)

# # Import notification routes (must be after all functions defined to avoid circular imports)
# try:
#     import notification_routes
# except ImportError as e:
#     print(f"Warning: Could not import notification_routes: {e}")

# if __name__ == '__main__':
#     # Start the monitoring thread
#     monitoring_thread = threading.Thread(target=monitor_irrigation, daemon=True)
#     monitoring_thread.start()
    
#     # Run the Flask app
#     app.run(debug=True)

from flask import Flask, render_template, request, jsonify
import pandas as pd
import requests
from datetime import datetime
import os
import threading
import time

# =========================================
# Flask App Configuration
# =========================================

app = Flask(
    __name__,
    static_url_path='',
    static_folder='static',
    template_folder='templates'
)

# =========================================
# In-Memory Storage
# =========================================

farmer_notifications = {}
active_alerts = {}

# =========================================
# Weather API Configuration
# =========================================

OPENWEATHER_API_KEY = os.environ.get(
    'OPENWEATHER_API_KEY',
    'your_api_key_here'
)

WEATHER_API_BASE_URL = \
    "http://api.openweathermap.org/data/2.5/weather"

# =========================================
# Irrigation Thresholds
# =========================================

IRRIGATION_THRESHOLDS = {
    'rice': {
        'min_soil_moisture': 80,
        'max_temperature': 35,
        'min_rainfall': 10,
        'humidity_threshold': 60
    },
    'wheat': {
        'min_soil_moisture': 60,
        'max_temperature': 30,
        'min_rainfall': 5,
        'humidity_threshold': 50
    },
    'maize': {
        'min_soil_moisture': 65,
        'max_temperature': 32,
        'min_rainfall': 7,
        'humidity_threshold': 55
    },
    'cotton': {
        'min_soil_moisture': 55,
        'max_temperature': 38,
        'min_rainfall': 8,
        'humidity_threshold': 45
    },
    'sugarcane': {
        'min_soil_moisture': 75,
        'max_temperature': 35,
        'min_rainfall': 15,
        'humidity_threshold': 65
    }
}

# =========================================
# Sample Weather Data
# =========================================

SAMPLE_WEATHER_DATA = {
    'salem': {
        'temp': 26,
        'humidity': 80,
        'rainfall': 5,
        'soil_moisture': 70
    },
    'chennai': {
        'temp': 34,
        'humidity': 72,
        'rainfall': 0,
        'soil_moisture': 60
    },
    'madurai': {
        'temp': 32,
        'humidity': 65,
        'rainfall': 2,
        'soil_moisture': 58
    }
}

# =========================================
# Utility Functions
# =========================================

def get_weather_data(location):
    """
    Fetch weather data from OpenWeatherMap API.
    """

    try:

        # ---------------------------------
        # OpenWeatherMap API
        # ---------------------------------

        if OPENWEATHER_API_KEY != 'your_api_key_here':

            params = {
                'q': location,
                'appid': OPENWEATHER_API_KEY,
                'units': 'metric'
            }

            response = requests.get(
                WEATHER_API_BASE_URL,
                params=params,
                timeout=10
            )

            if response.status_code == 200:

                data = response.json()

                print("Weather API response:", data)

                temperature = data['main']['temp']
                humidity = data['main']['humidity']

                rainfall = 0

                if 'rain' in data:
                    rainfall = data['rain'].get('1h', 0)

                return {
                    'temperature': temperature,
                    'humidity': humidity,
                    'rainfall': rainfall,
                    'soil_moisture': 70
                }

        # ---------------------------------
        # Sample Data Fallback
        # ---------------------------------

        location = location.lower()

        if location in SAMPLE_WEATHER_DATA:

            sample = SAMPLE_WEATHER_DATA[location]

            return {
                'temperature': sample['temp'],
                'humidity': sample['humidity'],
                'rainfall': sample['rainfall'],
                'soil_moisture': sample['soil_moisture']
            }

        # ---------------------------------
        # Default Fallback
        # ---------------------------------

        return {
            'temperature': 25,
            'humidity': 60,
            'rainfall': 0,
            'soil_moisture': 65
        }

    except Exception as e:

        print("Weather Error:", e)

        return {
            'temperature': 25,
            'humidity': 60,
            'rainfall': 0,
            'soil_moisture': 65
        }


def check_irrigation_need(weather_data, crop_type):

    if crop_type not in IRRIGATION_THRESHOLDS:
        return False, ["Unknown crop"]

    thresholds = IRRIGATION_THRESHOLDS[crop_type]

    temperature = weather_data['temperature']
    humidity = weather_data['humidity']
    rainfall = weather_data['rainfall']
    soil_moisture = weather_data['soil_moisture']

    reasons = []

    if soil_moisture < thresholds['min_soil_moisture']:
        reasons.append("Low soil moisture")

    if temperature > thresholds['max_temperature']:
        reasons.append("High temperature")

    if rainfall < thresholds['min_rainfall']:
        reasons.append("Low rainfall")

    if humidity < thresholds['humidity_threshold']:
        reasons.append("Low humidity")

    needs_irrigation = len(reasons) > 0

    return needs_irrigation, reasons


# =========================================
# Home Route
# =========================================

@app.route('/')
def home():
    return render_template('index.html')


# =========================================
# Weather Route
# =========================================

@app.route('/get_weather', methods=['POST'])
def get_weather():

    try:

        data = request.json

        location = data.get('location', '').strip()

        if not location:
            return jsonify({
                'status': 'error',
                'message': 'Location required'
            }), 400

        weather_data = get_weather_data(location)

        return jsonify({
            'status': 'success',
            'weather': weather_data
        })

    except Exception as e:

        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# =========================================
# Crop Recommendation Route
# =========================================

@app.route('/recommend_crop', methods=['POST'])
def recommend_crop():

    try:

        data = request.json

        temperature = float(data['temperature'])
        rainfall = float(data['rainfall'])

        # Recommendation Logic

        if temperature > 30 and rainfall > 200:
            crop = 'rice'

        elif temperature > 25 and rainfall > 100:
            crop = 'maize'

        elif rainfall < 50:
            crop = 'cotton'

        else:
            crop = 'wheat'

        recommendations = [
            {
                "name": crop,
                "confidence": 92,
                "description": f"{crop.capitalize()} is suitable for current weather conditions.",
                "optimal_temp": temperature,
                "required_rainfall": rainfall,
                "growing_period": 120
            }
        ]

        return jsonify({
            "status": "success",
            "recommendation": recommendations[0]["name"],
            "recommendations": recommendations
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# =========================================
# Yield Prediction Route
# =========================================

@app.route('/predict_yield', methods=['POST'])
def predict_yield():

    try:

        data = request.json

        temperature = float(data['temperature'])
        rainfall = float(data['rainfall'])
        area = float(data['area'])

        crop = data.get('crop', 'rice').lower()

        base_yields = {
            'rice': 4.5,
            'wheat': 3.5,
            'maize': 5.0,
            'cotton': 2.5,
            'sugarcane': 70
        }

        base = base_yields.get(crop, 3)

        if rainfall > 200:
            base *= 1.2

        if temperature > 35:
            base *= 0.8

        predicted_yield = base * area

        predictions = [
            {
                "crop": crop,
                "yield": round(predicted_yield, 2),
                "confidence": 88,
                "roi": 12
            }
        ]

        return jsonify({
            "status": "success",
            "crop": predictions[0]["crop"],
            "predicted_yield": predictions[0]["yield"],
            "predictions": predictions
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
# =========================================
# Previous Crops Route
# =========================================

@app.route('/previous_crops', methods=['POST'])
def previous_crops():

    try:

        data = request.json

        location = data.get('location', '').strip().lower()

        df = pd.read_csv('data/historical_crops.csv')

        df.columns = df.columns.str.strip().str.lower()

        filtered = df[
            df['location'].str.lower() == location
        ]

        years = []
        crops = []
        yields = []

        for _, row in filtered.iterrows():

            years.append(int(row['year']))
            crops.append(row['crop'])
            yields.append(float(row['yield']))

        return jsonify({
            "status": "success",
            "years": years,
            "crops": crops,
            "yields": yields
        })

    except Exception as e:

        print("Crop History Error:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================================
# Register Field Route
# =========================================

@app.route('/register_field', methods=['POST'])
def register_field():

    try:

        data = request.json

        farmer_id = data.get('farmer_id')
        field_name = data.get('field_name')
        crop_type = data.get('crop_type')
        location = data.get('location')

        if not farmer_id:
            return jsonify({
                'status': 'error',
                'message': 'farmer_id required'
            }), 400

        if farmer_id not in active_alerts:
            active_alerts[farmer_id] = []

        active_alerts[farmer_id].append({
            'field_name': field_name,
            'crop_type': crop_type,
            'location': location
        })

        return jsonify({
            'status': 'success',
            'message': 'Field registered successfully'
        })

    except Exception as e:

        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# =========================================
# Check Irrigation Route
# =========================================

@app.route('/check_irrigation', methods=['POST'])
def check_irrigation():

    try:

        data = request.json

        crop_type = data.get('crop_type', '').lower()
        location = data.get('location', '')

        weather_data = get_weather_data(location)

        needs_irrigation, reasons = check_irrigation_need(
            weather_data,
            crop_type
        )

        return jsonify({
            'status': 'success',
            'needs_irrigation': needs_irrigation,
            'reasons': reasons,
            'weather_data': weather_data
        })

    except Exception as e:

        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


# =========================================
# Background Monitoring
# =========================================

def monitor_irrigation():

    while True:

        try:

            for farmer_id, fields in active_alerts.items():

                for field in fields:

                    weather_data = get_weather_data(
                        field['location']
                    )

                    needs_irrigation, reasons = \
                        check_irrigation_need(
                            weather_data,
                            field['crop_type']
                        )

                    if needs_irrigation:

                        notification = {
                            'time': datetime.now().strftime(
                                '%Y-%m-%d %H:%M:%S'
                            ),
                            'field_name': field['field_name'],
                            'message': 'Irrigation Needed',
                            'reasons': reasons
                        }

                        if farmer_id not in farmer_notifications:
                            farmer_notifications[farmer_id] = []

                        farmer_notifications[farmer_id].append(
                            notification
                        )

        except Exception as e:

            print("Monitoring Error:", e)

        # Check every 30 mins
        time.sleep(1800)


# =========================================
# Main
# =========================================

if __name__ == '__main__':

    monitoring_thread = threading.Thread(
        target=monitor_irrigation,
        daemon=True
    )

    monitoring_thread.start()

    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )