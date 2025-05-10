import express from 'express';
import { generateReport } from '../controllers/routeReportController.js';


const router = express.Router();

router.post('/generate', generateReport);

export default router;