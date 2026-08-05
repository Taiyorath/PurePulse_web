import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

def load_data(file_path):
    # Load the dataset
    data = pd.read_csv(file_path)

    # Preprocess the data
    # Assuming the dataset has a 'date' column and 'AQI' column
    data['date'] = pd.to_datetime(data['date'])
    data.set_index('date', inplace=True)

    # Normalize the AQI values
    scaler = MinMaxScaler()
    data['AQI'] = scaler.fit_transform(data[['AQI']])

    # Create features and labels
    X = data[['AQI']].shift(1).dropna()  # Previous day's AQI as feature
    y = data['AQI'].iloc[1:]  # Today's AQI as label

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    return (X_train.values, y_train.values), (X_test.values, y_test.values)