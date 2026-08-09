import Transaction from '../models/Transaction.js';
import FuelInventory from '../models/FuelInventory.js';
import Forecast from '../models/Forecast.js';

export const calculateStationForecasts = async () => {
  const stations = await FuelInventory.find({});
  const forecasts = [];

  for (const station of stations) {
    // Fetch transactions for this station
    const txs = await Transaction.find({
      stationName: station.stationName,
      transactionStatus: 'Completed'
    });

    // Compute moving average of dispensed volumes
    let totalDispensed = 0;
    txs.forEach(t => {
      totalDispensed += t.allocatedAmount || 0;
    });

    const averageDemand = txs.length > 0 ? (totalDispensed / txs.length) * 10 : 8000;
    const expectedDemand = Math.max(100, Math.round(averageDemand + (Math.random() * 1000 - 500))); // Add volatility delta
    const predictedShortage = Math.max(0, expectedDemand - station.stock);

    // Save calculation metrics to Forecast collection
    const forecast = await Forecast.findOneAndUpdate(
      { stationName: station.stationName },
      {
        stationName: station.stationName,
        date: new Date(),
        expectedDemand,
        predictedShortage,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    forecasts.push(forecast);
  }

  return forecasts;
};
