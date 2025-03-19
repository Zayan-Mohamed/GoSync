import express from 'express';
import {
  createStop,
  editStop,
  deleteStop,
  getStop,
  getAllStops,
  toggleStopStatus
} from '../controllers/stopController.js';
import { updateStop } from '../controllers/routeController.js';

const router = express.Router();

router.post('/create', createStop);
router.put('/edit', editStop);
router.delete('/:stopId', deleteStop);
router.get('/get', getAllStops);
router.get('/:stopId', getStop);
router.put('/:stopId', updateStop );
router.put('/:stopId/status', toggleStopStatus);

export default router;
