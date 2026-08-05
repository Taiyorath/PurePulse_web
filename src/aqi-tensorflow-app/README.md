# AQI TensorFlow Application

This project is a TensorFlow application designed to predict Air Quality Index (AQI) spikes using historical data. The application loads the dataset, preprocesses the data, trains a TensorFlow model, and evaluates its performance.

## Project Structure

```
aqi-tensorflow-app
├── src
│   ├── main.py          # Entry point of the application
│   ├── model.py         # Defines the TensorFlow model architecture
│   ├── data_loader.py    # Functions to load and preprocess data
│   └── utils.py         # Utility functions for data processing and visualization
├── requirements.txt     # Project dependencies
├── README.md            # Project documentation
└── .gitignore           # Files and directories to ignore by Git
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd aqi-tensorflow-app
   ```

2. **Create a virtual environment (optional but recommended):**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the required dependencies:**
   ```
   pip install -r requirements.txt
   ```

## Usage

To run the application, execute the following command:

```
python src/main.py
```

This will load the historical AQI data, preprocess it, train the TensorFlow model, and evaluate its performance.

## Model Overview

The model is designed to predict AQI spikes based on historical data. It utilizes a neural network architecture defined in `src/model.py`. The training and testing datasets are loaded and preprocessed in `src/data_loader.py`, while utility functions for data visualization are provided in `src/utils.py`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.