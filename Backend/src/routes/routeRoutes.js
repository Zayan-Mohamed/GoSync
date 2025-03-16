import express from 'express';
import {
  createRoute,
  addStopToRoute,
  getRouteById,
  toggleRouteStatus
} from '../controllers/routeController.js';

const router = express.Router();

router.post('/create', createRoute);
router.post('/add-stop', addStopToRoute);
router.get('/:routeId', getRouteById);
router.patch('/:routeId/status', toggleRouteStatus);

export default router;
