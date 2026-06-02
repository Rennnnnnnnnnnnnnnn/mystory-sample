import express from 'express';
import { updateEmail, updatePassword, updateUsername, deleteAccount, getCurrentUser } from '../controllers/accountControllers.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.put("/update-username", authenticate, updateUsername);
router.put("/update-email", authenticate, updateEmail);
router.put("/update-password", authenticate, updatePassword);
router.delete("/delete", authenticate, deleteAccount)
router.get("/me", authenticate, getCurrentUser);


export default router;

