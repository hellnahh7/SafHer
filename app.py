from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from data import AREAS, EMERGENCY_LOCATIONS

app = Flask(__name__)
CORS(app)

# --- Configuration & Algorithm Constants ---
# Rs = (I * wi) + (C * wc) + (L * wl) + Dn
# Note: For our mock data:
# Crowd (C) is 1-10 (High is better/safer). Inverse: (11 - C)
# Lighting (L) is 1-10 (High is better/safer). Inverse: (11 - L)
# Incident (I) is count (Low is better).

WEIGHT_INCIDENT = 1.0
WEIGHT_CROWD = 0.5
WEIGHT_LIGHTING = 0.5
NIGHT_PENALTY = 2.0

def calculate_risk_score(area, is_night):
    i = area['incident_rate']
    c_inv = 11 - area['crowd_level']
    l_inv = 11 - area['lighting_quality']
    
    score = (i * WEIGHT_INCIDENT) + (c_inv * WEIGHT_CROWD) + (l_inv * WEIGHT_LIGHTING)
    
    if is_night:
        score += NIGHT_PENALTY
        
    return round(score, 1)

def get_safety_category(score):
    if score <= 4:
        return {"category": "Low Risk", "color": "green", "badge": "🟢 Safe", "action": "Recommended for solo travel."}
    elif score <= 7:
        return {"category": "Moderate", "color": "yellow", "badge": "🟡 Moderate", "action": "Travel with caution / share location."}
    else:
        return {"category": "High Risk", "color": "red", "badge": "🔴 Risky", "action": "Avoid; seek alternative well-lit routes."}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/areas', methods=['GET'])
def get_areas():
    return jsonify({"areas": AREAS, "emergency_locations": EMERGENCY_LOCATIONS})

@app.route('/api/route', methods=['POST'])
def calculate_route():
    data = request.json
    from_loc_id = data.get('from', '')
    to_loc_id = data.get('to', '')
    is_night = data.get('is_night', False)

    # Simplified logic: just find the target area and calculate risk for it.
    # In a real app, this would calculate scores along a path.
    target_area = next((a for a in AREAS if a['id'] == to_loc_id), None)
    
    if not target_area:
        return jsonify({"error": "Destination not found"}), 404

    score = calculate_risk_score(target_area, is_night)
    safety_info = get_safety_category(score)
    
    # Mock estimated time based on distance (simplified)
    # 15 - 35 mins random mock
    import random
    estimated_time = random.randint(15, 35)

    response = {
        "destination": target_area['name'],
        "coordinates": target_area['coordinates'],
        "risk_score": score,
        "safety_info": safety_info,
        "estimated_time": f"{estimated_time} mins",
        "factors": {
            "crowd": target_area['crowd_level'],
            "lighting": target_area['lighting_quality'],
            "incidents": target_area['incident_rate']
        }
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
