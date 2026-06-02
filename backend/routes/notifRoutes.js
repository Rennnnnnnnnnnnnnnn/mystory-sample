import express from "express";

import authenticate from "../middlewares/authenticate.js";
import { getNotifications, getUnreadNotificationCount, updateNotificationRead } from "../controllers/notifController.js";

const router = express.Router();

// Public story routes
router.get('/getNotifications', authenticate, getNotifications); // Get all public stories
router.post('/updateNotificationRead', authenticate, updateNotificationRead);
router.get('/getUnreadNotificationCount', authenticate, getUnreadNotificationCount);

export default router;

