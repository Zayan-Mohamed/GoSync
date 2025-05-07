import express from 'express';
import {
  createRoute,
  createMultipleRoutes,
  addStopToRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  updateStopInRoute,
  getStopsForRoute,
  deleteStopFromRoute,
  deleteRoute,
  updateStopType,
  addMultipleStops,
  toggleRouteStatus, 
  getRouteAnalytics,
} from '../controllers/routeController.js';
import { adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Define all specific routes first
router.post('/create', createRoute);
router.post('/routes/bulk', createMultipleRoutes);
router.post('/add-stop', addStopToRoute);
router.post('/update-stop-type', updateStopType);
router.post('/add-multiple-stops', addMultipleStops); // <-- move this UP
router.get('/routes', getAllRoutes);
router.put('/:routeId/status', toggleRouteStatus);
router.put('/:routeId', updateRoute);
router.put('/:routeId/stops/:stopId', updateStopInRoute);
router.get('/routes/:routeId/stops', getStopsForRoute);
router.delete('/routes/:routeId/stops/:stopId', deleteStopFromRoute);
router.delete('/routes/:routeId', deleteRoute);
router.get('/route-analytics', getRouteAnalytics);

// ✅ Always define dynamic routes like this LAST
router.get('/:id', getRouteById);

//router.post('/update-multiple-stop-type', addMultipleStopsWithTypes);
export default router;
