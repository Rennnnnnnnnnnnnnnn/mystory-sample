import express from "express";
import { addLike, createStory, deleteLike, deleteStory, getPrivateStories, getPublicStories, updateStory, incrementReadCount, getIndividualPublicPost, saveStory, unsaveStory, getSavedStories, downloadStories } from "../controllers/storyController.js";
import authenticate from "../middlewares/authenticate.js";
import optionalAuthenticate from "../middlewares/optionalAuthenticate.js";

const router = express.Router();

// Public / Private Stories
router.get('/getPublicStories', optionalAuthenticate, getPublicStories); // Get all public stories
router.get('/getPrivateStories', authenticate, getPrivateStories); // Get private stories for a specific user
router.get('/getIndividualPublicPost/:post_id', optionalAuthenticate, getIndividualPublicPost); // Get one public story
router.get("/downloadStories", authenticate, downloadStories);

// Story Management (CRUD)
router.post('/createStory', authenticate, createStory); // Create a new story
router.put('/updateStory', authenticate, updateStory); // Update an existing story
router.delete('/deleteStory/:post_id', authenticate, deleteStory); // Delete a specific story
// Engagement (Likes & Views)
router.post('/addLike', authenticate, addLike); // Like a story
router.delete('/deleteLike', authenticate, deleteLike); // Remove like
router.post('/incrementReadCount/:post_id', optionalAuthenticate, incrementReadCount); // Increment story read count
// Saved Stories (User Library)
router.post('/saveStory', authenticate, saveStory); // Save a story
router.delete('/unsaveStory', authenticate, unsaveStory); // Remove saved story
router.get('/getSavedStories', authenticate, getSavedStories); // Get user's saved stories


export default router;

