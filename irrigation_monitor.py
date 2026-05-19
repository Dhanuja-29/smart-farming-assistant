# Define irrigation thresholds for different crops
IRRIGATION_THRESHOLDS = {
    "wheat": {
        "min_soil_moisture": 30,
        "max_temperature": 35,
        "min_rainfall": 50,
        "humidity_threshold": 40,
    },
    "rice": {
        "min_soil_moisture": 40,
        "max_temperature": 40,
        "min_rainfall": 100,
        "humidity_threshold": 50,
    },
    # Add more crops as needed
}

def check_irrigation_need(weather_data, crop_type):
    """
    Check if irrigation is needed based on weather data and crop thresholds.
    """
    if crop_type not in IRRIGATION_THRESHOLDS:
        return False, "Unknown crop type"
    
    thresholds = IRRIGATION_THRESHOLDS[crop_type]
    
    # Extract weather parameters
    temperature = weather_data.get('temperature', 0)
    humidity = weather_data.get('humidity', 0)
    rainfall = weather_data.get('rainfall', 0)
    soil_moisture = weather_data.get('soil_moisture', 0)
    
    # Check conditions
    needs_irrigation = False
    reasons = []
    
    if soil_moisture < thresholds['min_soil_moisture']:
        needs_irrigation = True
        reasons.append(f"Soil moisture ({soil_moisture}%) is below minimum threshold ({thresholds['min_soil_moisture']}%)")
    
    if temperature > thresholds['max_temperature']:
        needs_irrigation = True
        reasons.append(f"Temperature ({temperature}°C) is above maximum threshold ({thresholds['max_temperature']}°C)")
    
    if rainfall < thresholds['min_rainfall']:
        needs_irrigation = True
        reasons.append(f"Rainfall ({rainfall}mm) is below minimum threshold ({thresholds['min_rainfall']}mm)")
    
    if humidity < thresholds['humidity_threshold']:
        needs_irrigation = True
        reasons.append(f"Humidity ({humidity}%) is below threshold ({thresholds['humidity_threshold']}%)")
    
    return needs_irrigation, reasons