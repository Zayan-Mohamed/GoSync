import express from 'express';
import { 
  createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute, toggleRouteStatus 
} from '../controllers/routes.controller.js';
import { 
  addStopToRoute, getStopsForRoute, updateStopInRoute, deleteStopFromRoute , toggleStopStatus
} from '../controllers/stops.controller.js';

const router = express.Router();

// Route Management Endpoints
router.post('/routes', createRoute);
router.get('/routes', getAllRoutes);
router.get('/routes/:routeId', getRouteById);
router.put('/routes/:routeId', updateRoute);
router.delete('/routes/:routeId', deleteRoute);
router.put('/routes/:routeId/status', toggleRouteStatus);

// Stop Management Endpoints
router.post('/routes/:routeId/stops', addStopToRoute);
router.get('/routes/:routeId/stops', getStopsForRoute);
router.put('/routes/:routeId/stops/:stopId', updateStopInRoute);
router.delete('/routes/:routeId/stops/:stopId', deleteStopFromRoute);
router.put("/routes/:routeId/stops/:stopId/status", toggleStopStatus);


export default router;