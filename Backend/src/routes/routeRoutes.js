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

  updateStopType,

  addMultipleStopsWithTypes,
  toggleRouteStatus
} from '../controllers/routeController.js';

const router = express.Router();

router.post('/create', createRoute);
router.post('/add-stop', addStopToRoute);
//router.post('/add-multiple-stops', addMultipleStopsToRoute);
router.post('/update-stop-type', updateStopType);
//router.post('/update-multiple-stop-types', updateMultipleStopTypes);
router.get('/routes', getAllRoutes);
router.get('/:routeId', getRouteById);
router.put('/:routeId/status', toggleRouteStatus);
router.post('/add-multiple-stops', addMultipleStopsWithTypes);
router.put('/:routeId', updateRoute);
router.get('/routes/:routeId/stops', getStopsForRoute);
router.delete('/routes/:routeId/stops/:stopId', deleteStopFromRoute);
router.delete('/routes/:routeId', deleteRoute);


export default router;
