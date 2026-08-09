import express from 'express';
import { registerVehicle, getVehicleByPlate } from '../controllers/vehicleController.js';

const router = express.Router();

router.post('/', registerVehicle);
router.get('/:plate', getVehicleByPlate);

export default router;
