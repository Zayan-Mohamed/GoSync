import express from 'express';
import {
  createStop,
  createMultipleStops,
  editStop,
  deleteStop,
  getStop,
  getAllStops,
  toggleStopStatus
} from '../controllers/stopController.js';

const router = express.Router();

router.post('/create', createStop);
router.post('/bulk', createMultipleStops);
// router.put('/edit', editStop);
//router.delete('/:stopId', deleteStop);
router.get('/get', getAllStops);
router.get('/:stopId', getStop);
// router.put('/:stopId', updateStop );
router.put('/id/:id/status', toggleStopStatus);
router.put('/id/:id', editStop);
router.delete('/id/:id', deleteStop);

export default router;
