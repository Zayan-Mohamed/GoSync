import express from 'express';
import { 
  createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute, toggleRouteStatus 
} from '../controllers/routes.controller.js';
import { 
  addStopToRoute, getStopsForRoute, updateStopInRoute, deleteStopFromRoute 
} from '../controllers/stops.controller.js';

const router = express.Router();

// Route Management Endpoints
router.post('/routes', createRoute);
router.get('/routes', getAllRoutes);
router.get('/routes/:id', getRouteById);
router.put('/routes/:id', updateRoute);
router.delete('/routes/:id', deleteRoute);
router.put('/routes/:id/status', toggleRouteStatus);

// Stop Management Endpoints
router.post('/routes/:routeId/stops', addStopToRoute);
router.get('/routes/:routeId/stops', getStopsForRoute);
router.put('/routes/:routeId/stops/:stopId', updateStopInRoute);
router.delete('/routes/:routeId/stops/:stopId', deleteStopFromRoute);

export default router;
