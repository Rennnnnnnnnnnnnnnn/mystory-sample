import express from 'express';
import { createComment, getCommentsByPost, deleteComment, updateComment, addCommentLike, deleteCommentLike } from '../controllers/commentControllers.js';
import authenticate from '../middlewares/authenticate.js';
import optionalAuthenticate from '../middlewares/optionalAuthenticate.js';

const router = express.Router();

router.post("/createComment", authenticate, createComment);
router.get("/getComments/:post_id", optionalAuthenticate, getCommentsByPost);
router.delete("/deleteComment/:comment_id", authenticate, deleteComment);
router.put("/update-comment", authenticate, updateComment);
router.post('/addCommentLike', authenticate, addCommentLike)
router.delete('/deleteCommentLike', authenticate, deleteCommentLike);

export default router;

