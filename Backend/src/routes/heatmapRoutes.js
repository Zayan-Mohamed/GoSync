import express from 'express';
import { getUserHeatmapCoordinates } from '../controllers/heatmapController.js';
import { protect } from '../middlewares/authMiddleware.js'; // Import the protect middleware

const router = express.Router();

// Protected route that requires authentication
router.get('/heatmap', protect, getUserHeatmapCoordinates);

export default router;