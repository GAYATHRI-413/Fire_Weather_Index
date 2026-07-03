from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, 'model.pkl')
scaler_path = os.path.join(BASE_DIR, 'scaler.pkl')

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    print("Model and Scaler Loaded")
except Exception as e:
    print("ERROR loading model/scaler:", str(e))
    model = None
    scaler = None


# ⭐ HOME ROUTE (THIS FIXES YOUR 404)
@app.route('/')
def home():
    return "🔥 Fire Weather Index API is Running"


# ⭐ PREDICTION ROUTE
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None or scaler is None:
            return jsonify({"error": "Model not loaded"}), 500

        data = request.get_json()

        required = [
            "day", "month", "year", "Temperature", "RH", "Ws",
            "Rain", "FFMC", "DMC", "DC", "ISI", "BUI"
        ]

        if not data:
            return jsonify({"error": "No JSON received"}), 400

        for key in required:
            if key not in data:
                return jsonify({"error": f"Missing field: {key}"}), 400

        features = np.array([[
            data["day"], data["month"], data["year"],
            data["Temperature"], data["RH"], data["Ws"],
            data["Rain"], data["FFMC"], data["DMC"],
            data["DC"], data["ISI"], data["BUI"]
        ]])

        scaled = scaler.transform(features)
        prediction = model.predict(scaled)[0]

        return jsonify({"fwi": float(prediction)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ⭐ IMPORTANT FOR RENDER (DO NOT RELY ON app.run)