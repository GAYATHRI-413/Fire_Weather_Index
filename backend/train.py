import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, Lasso, Ridge
from sklearn.metrics import r2_score
import pickle

# Load dataset
file_path = r"C:\Users\hplap\OneDrive\Documents\FWI_project\backend\Algerian_forest_fires_dataset.csv"
df = pd.read_csv(file_path)

df.columns = df.columns.str.strip()
df = df[df["Temperature"] != "Temperature"]
df = df.replace(['?', 'NaN'], np.nan)
df = df.dropna()
features = ['day','month','year','Temperature', 'RH', 'Ws', 'Rain', 'FFMC', 'DMC', 'DC', 'ISI', 'BUI']
target = 'FWI'
df[features] = df[features].astype(float)
df[target] = df[target].astype(float)

X = df[features]
y = df[target]


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


models = {
    "Linear Regression": LinearRegression(),
    "Lasso Regression": Lasso(alpha=0.01),
    "Ridge Regression": Ridge(alpha=0.01)
}

best_model = None
best_r2 = -1

for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    r2 = r2_score(y_test, model.predict(X_test_scaled))
    print(f"{name} R²: {r2:.3f}")
    if r2 > best_r2:
        best_r2 = r2
        best_model = model

# SAVE MODEL + SCALER
with open("model.pkl", "wb") as f:
    pickle.dump(best_model, f)

with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("Model & scaler saved successfully.")
