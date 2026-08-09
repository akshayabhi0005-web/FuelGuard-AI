import Transaction from '../models/Transaction.js';
import Vehicle from '../models/Vehicle.js';
import FuelInventory from '../models/FuelInventory.js';

// Distance matrix in km between operational districts
const DISTRICT_DISTANCES = {
  'Colombo-Galle': 120,
  'Colombo-Kandy': 115,
  'Colombo-Gampaha': 30,
  'Galle-Kandy': 220,
  'Galle-Gampaha': 150,
  'Kandy-Gampaha': 90
};

const getDistance = (d1, d2) => {
  if (d1 === d2) return 0;
  const key1 = `${d1}-${d2}`;
  const key2 = `${d2}-${d1}`;
  return DISTRICT_DISTANCES[key1] || DISTRICT_DISTANCES[key2] || 50; // default 50km
};

export const auditTransaction = async (userId, vehicleNumber, stationName) => {
  // 1. Vehicle signature check
  const vehicle = await Vehicle.findOne({ vehicleNumber });
  if (!vehicle || vehicle.ownerId.toString() !== userId.toString()) {
    return {
      isAnomaly: true,
      type: 'Vehicle Signature Mismatch',
      details: `Scanned vehicle plate '${vehicleNumber}' is not registered under citizen ID '${userId}'.`,
      riskScore: 50
    };
  }

  // 2. Fetch last completed transaction for this citizen
  const lastTx = await Transaction.findOne({
    userId,
    transactionStatus: 'Completed'
  }).sort({ createdAt: -1 });

  if (lastTx) {
    const timeDeltaMs = Date.now() - new Date(lastTx.createdAt).getTime();
    const timeDeltaMins = timeDeltaMs / (60 * 1000);

    // Anomaly Check A: Frequency cap violation (Rapid dispense < 3 minutes)
    if (timeDeltaMins < 3) {
      return {
        isAnomaly: true,
        type: 'Rapid Dispense Attempt',
        details: `Dispense requested only ${timeDeltaMins.toFixed(1)} mins after previous transaction '${lastTx.transactionId}' at '${lastTx.stationName}'.`,
        riskScore: 70
      };
    }

    // Anomaly Check B: Spatiotemporal Velocity Violation
    const currentStation = await FuelInventory.findOne({ stationName });
    const prevStation = await FuelInventory.findOne({ stationName: lastTx.stationName });

    if (currentStation && prevStation && currentStation.district !== prevStation.district) {
      const distance = getDistance(currentStation.district, prevStation.district);
      const travelTimeHours = timeDeltaMins / 60;
      const velocity = travelTimeHours > 0 ? distance / travelTimeHours : 999;

      // Travelling above 110 km/h between districts is considered a velocity breach
      if (velocity > 110) {
        return {
          isAnomaly: true,
          type: 'Spatiotemporal Anomaly',
          details: `Travel between '${prevStation.stationName}' (${prevStation.district}) and '${stationName}' (${currentStation.district}) is ${distance} km apart. Elapsed: ${timeDeltaMins.toFixed(1)} mins (Speed: ${velocity.toFixed(0)} km/h).`,
          riskScore: 90
        };
      }
    }
  }

  return { isAnomaly: false };
};
