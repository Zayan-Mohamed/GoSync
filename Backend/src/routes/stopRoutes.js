import express from 'express';
import {
  createStop,
  editStop,
  deleteStop,
  getStop,
  getAllStops,
  toggleStopStatus
} from '../controllers/stopController.js';

const router = express.Router();

router.post('/create', createStop);
router.put('/edit', editStop);
router.delete('/:stopId', deleteStop);
router.get('/:stopId', getStop);
router.get('/get', getAllStops);
router.put('/:stopId/status', toggleStopStatus);

export default router;
