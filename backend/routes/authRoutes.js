import express from 'express';
import { createUser, loginUser, logoutUser, refreshUserToken } from '../controllers/authControllers.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refreshUserToken", refreshUserToken);

router.get('/verifyUser', authenticate, (req, res) => {
    res.json({ message: 'User is verified!', user: req.userData });
});



export default router;

