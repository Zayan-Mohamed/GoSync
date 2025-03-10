import express from "express"

import { create } from "../controllers/notificationController.js"

const route = express.Router();

route.post("/notification",create)

export default route;