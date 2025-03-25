import express from 'express';
import {
  createRoute,
  addStopToRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  getStopsForRoute,
  deleteStopFromRoute,
  deleteRoute,
  toggleRouteStatus
} from '../controllers/routeController.js';

const router = express.Router();

router.post('/create', createRoute);
router.post('/add-stop', addStopToRoute);
router.get('/routes', getAllRoutes);
router.get('/:routeId', getRouteById);
router.put('/:routeId/status', toggleRouteStatus);
router.put('/:routeId', updateRoute);
router.get('/routes/:routeId/stops', getStopsForRoute);
router.delete('/routes/:routeId/stops/:stopId', deleteStopFromRoute);
router.delete('/routes/:routeId', deleteRoute);


export default router;
