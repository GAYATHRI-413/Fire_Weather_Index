import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix missing marker icons in Leaflet
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to automatically recenter map
function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (
      lat &&
      lon &&
      !isNaN(parseFloat(lat)) &&
      !isNaN(parseFloat(lon))
    ) {
      map.setView([parseFloat(lat), parseFloat(lon)], 12, { animate: true });
    }
  }, [lat, lon, map]);
  return null;
}

function App() {
  const [formData, setFormData] = useState({
    day: "",
    month: "",
    year: "",
    Temperature: "",
    RH: "",
    Ws: "",
    Rain: "",
    FFMC: "",
    DMC: "",
    DC: "",
    ISI: "",
    BUI: "",
    latitude: "",
    longitude: ""
  });

  const [prediction, setPrediction] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get device GPS
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
      },
      (err) => {
        alert("Location error. Allow permission.");
        console.error(err);
      }
    );
  };

  // Risk level calculation
  const computeRiskLevel = (fwi) => {
    const v = parseFloat(fwi);
    if (v < 6) return { label: "Low", color: "#2ecc71" };
    if (v < 12) return { label: "Moderate", color: "#f1c40f" };
    if (v < 20) return { label: "High", color: "#e67e22" };
    return { label: "Extreme", color: "#e74c3c" };
  };

  // Submit to Flask backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setRiskLevel(null);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      const fwiVal = parseFloat(data.fwi).toFixed(2);

      setPrediction(fwiVal);
      setRiskLevel(computeRiskLevel(fwiVal));
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  const defaultCenter = [20.5937, 78.9629];

  return (
    <div style={{ padding: 20, fontFamily: "Segoe UI" }}>
      <h1>🔥 Fire Weather Index (FWI)</h1>

      {/* Location Section */}
      <button
        onClick={getLocation}
        style={{
          padding: "8px 14px",
          background: "#0077ff",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        📍 Get My Location
      </button>

      <p>
        <b>Lat:</b> {formData.latitude || "—"} &nbsp; <b>Lon:</b> {formData.longitude || "—"}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {Object.keys(formData).map((key) => (
            <div key={key}>
              <label style={{ fontWeight: "bold" }}>{key}</label>

              <input
                name={key}
                value={formData[key]}
                onChange={handleChange}
                step="any"
                required={key !== "latitude" && key !== "longitude"}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
                type={
                  key === "latitude" || key === "longitude"
                    ? "text"
                    : "number"
                }
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            background: "#ff6600",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {loading ? "Predicting..." : "Predict FWI"}
        </button>
      </form>

      {/* Result */}
      {prediction && (
        <div style={{ marginTop: 20, padding: 15, border: "2px solid #ff6600", borderRadius: 10 }}>
          <h3>Predicted FWI: {prediction}</h3>
          <h3>
            Fire Risk Level:{" "}
            <span
              style={{
                background: riskLevel.color,
                padding: "6px 10px",
                color: "white",
                borderRadius: 6,
              }}
            >
              {riskLevel.label}
            </span>
          </h3>

          <p>
            <b>Selected Location</b> <br />
            Lat: {formData.latitude} <br />
            Lon: {formData.longitude}
          </p>
        </div>
      )}

      {/* Map */}
      <div style={{ marginTop: 20 }}>
        <div style={{ height: 400, borderRadius: 10, overflow: "hidden" }}>
          <MapContainer
            center={
              formData.latitude &&
              formData.longitude &&
              !isNaN(parseFloat(formData.latitude)) &&
              !isNaN(parseFloat(formData.longitude))
                ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
                : defaultCenter
            }
            zoom={formData.latitude ? 12 : 5}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <RecenterMap lat={formData.latitude} lon={formData.longitude} />

            {formData.latitude &&
              formData.longitude &&
              !isNaN(parseFloat(formData.latitude)) &&
              !isNaN(parseFloat(formData.longitude)) && (
                <Marker
                  position={[
                    parseFloat(formData.latitude),
                    parseFloat(formData.longitude),
                  ]}
                >
                  <Popup>
                    Selected Location <br />
                    Lat: {formData.latitude} <br />
                    Lon: {formData.longitude}
                  </Popup>
                </Marker>
              )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
