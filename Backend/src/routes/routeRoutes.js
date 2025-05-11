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
  reorderRouteStops,
} from '../controllers/routeController.js';
import { adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Analytics endpoint - make sure this comes before other routes to avoid path conflicts
router.get('/route-analytics', getRouteAnalytics);

// Define all specific routes
router.post('/create', createRoute);
router.post('/routes/bulk', createMultipleRoutes);
router.post('/add-stop', addStopToRoute);
router.post('/update-stop-type', updateStopType);
router.post('/add-multiple-stops', addMultipleStops);
router.post('/:routeId/reorder-stops', reorderRouteStops);
router.get('/routes', getAllRoutes);
router.put('/:routeId/status', toggleRouteStatus);
router.put('/:routeId', updateRoute);
router.put('/:routeId/stops/:stopId', updateStopInRoute);
router.get('/routes/:routeId/stops', getStopsForRoute);
router.delete('/routes/:routeId/stops/:stopId', deleteStopFromRoute);
router.delete('/routes/:routeId', deleteRoute);

// ✅ Always define dynamic routes like this LAST
router.get('/:id', getRouteById);

export default router;
