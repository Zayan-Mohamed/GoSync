import express from 'express';
import {
  createStop,
  editStop,
  deleteStop,
  getStop,
  toggleStopStatus
} from '../controllers/stopController.js';

const router = express.Router();

router.post('/create', createStop);
router.patch('/edit', editStop);
router.delete('/:stopId', deleteStop);
router.get('/:stopId', getStop);
router.patch('/:stopId/status', toggleStopStatus);

export default router;
