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
  addMultipleStopsWithTypes,
  toggleRouteStatus
} from '../controllers/routeController.js';

const router = express.Router();

router.post('/create', createRoute);
router.post('/routes/bulk', createMultipleRoutes);
router.post('/add-stop', addStopToRoute);
router.post('/update-stop-type', updateStopType);
router.get('/routes', getAllRoutes);
router.get('/:id', getRouteById);
router.put('/:routeId/status', toggleRouteStatus);
router.post('/add-multiple-stops', addMultipleStopsWithTypes);
router.put('/:routeId', updateRoute);
//router.put('/:stopId', updateStop);
router.put('/:routeId/stops/:stopId', updateStopInRoute);
router.get('/routes/:routeId/stops', getStopsForRoute);
router.delete('/routes/:routeId/stops/:stopId', deleteStopFromRoute);
router.delete('/routes/:routeId', deleteRoute);
//router.post('/update-multiple-stop-types', updateMultipleStopTypes);
//router.post('/add-multiple-stops', addMultipleStopsToRoute);
export default router;
