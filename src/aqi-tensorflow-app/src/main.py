import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt

# Simulate real-time AQI data (replace with API data in production)
def generate_synthetic_aqi_data(n_days=120):
    np.random.seed(42)
    dates = pd.date_range(end=pd.Timestamp.today(), periods=n_days)
    base_aqi = 80 + np.sin(np.arange(n_days) / 10) * 20
    spikes = np.random.binomial(1, 0.05, n_days) * np.random.randint(50, 150, n_days)
    aqi = base_aqi + spikes + np.random.normal(0, 10, n_days)
    df = pd.DataFrame({'date': dates, 'AQI': np.clip(aqi, 10, 500)})
    return df

# Prepare data for LSTM
def prepare_data(df, lookback=7):
    scaler = MinMaxScaler()
    df['AQI_scaled'] = scaler.fit_transform(df[['AQI']])
    X, y = [], []
    for i in range(lookback, len(df)):
        X.append(df['AQI_scaled'].values[i-lookback:i])
        y.append(df['AQI_scaled'].values[i])
    X, y = np.array(X), np.array(y)
    return X, y, scaler

# Build LSTM model
def build_model(input_shape):
    model = Sequential([
        LSTM(64, input_shape=input_shape, return_sequences=False),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

# Detect spikes (simple threshold-based)
def detect_spikes(y_true, y_pred, threshold=0.15):
    spikes = []
    for i in range(len(y_pred)):
        if y_pred[i] - y_true[i] > threshold:
            spikes.append(i)
    return spikes

def main():
    # 1. Simulate or load AQI data
    df = generate_synthetic_aqi_data(n_days=180)
    lookback = 7

    # 2. Prepare data
    X, y, scaler = prepare_data(df, lookback=lookback)
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    # 3. Build and train model
    model = build_model((lookback, 1))
    model.fit(X_train, y_train, epochs=30, batch_size=16, validation_split=0.2, verbose=1)

    # 4. Predict and evaluate
    y_pred = model.predict(X_test)
    y_pred_inv = scaler.inverse_transform(y_pred)
    y_test_inv = scaler.inverse_transform(y_test.reshape(-1, 1))

    # 5. Detect spikes
    spike_indices = detect_spikes(y_test, y_pred.flatten())
    print(f"Detected {len(spike_indices)} predicted AQI spikes in test data.")

    # 6. Plot results
    plt.figure(figsize=(12,6))
    plt.plot(df['date'].values[-len(y_test):], y_test_inv, label='Actual AQI')
    plt.plot(df['date'].values[-len(y_test):], y_pred_inv, label='Predicted AQI')
    plt.scatter(df['date'].values[-len(y_test):][spike_indices], y_pred_inv[spike_indices], color='red', label='Predicted Spikes')
    plt.title('AQI Prediction & Spike Detection')
    plt.xlabel('Date')
    plt.ylabel('AQI')
    plt.legend()
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    main()