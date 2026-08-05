def plot_results(actual, predicted):
    import matplotlib.pyplot as plt

    plt.figure(figsize=(10, 5))
    plt.plot(actual, label='Actual AQI', color='blue')
    plt.plot(predicted, label='Predicted AQI', color='red')
    plt.title('AQI Prediction Results')
    plt.xlabel('Time')
    plt.ylabel('AQI')
    plt.legend()
    plt.show()

    