import express from 'express';
import {
  createStop,
  createMultipleStops,
  editStop,
  deleteStop,
  getStop,
  getAllStops
} from '../controllers/stopController.js';
import { updateStop,toggleStopStatus } from '../controllers/routeController.js';

const router = express.Router();

router.post('/create', createStop);
router.post('/bulk', createMultipleStops);
router.put('/edit', editStop);
router.delete('/:stopId', deleteStop);
router.get('/get', getAllStops);
router.get('/:stopId', getStop);
router.put('/:stopId', updateStop );
router.put('/:stopId/status', toggleStopStatus);

export default router;
