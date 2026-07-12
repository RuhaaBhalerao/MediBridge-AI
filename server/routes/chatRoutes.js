import express from "express";
import {
  chatWithMediBridge,
  getChatHistory,
  listChatSessions,
} from "../controllers/chatController.js";
import { protect } from "../middlewear/authMiddlewear.js";

const router = express.Router();

// POST /api/chat          — send a message (requires auth so it saves to user's session)
router.post("/", protect, chatWithMediBridge);

// GET  /api/chat/sessions — list all sessions for the logged-in user
router.get("/sessions", protect, listChatSessions);

// GET  /api/chat/:claimId/history — full message history for one claim session
router.get("/:claimId/history", protect, getChatHistory);

export default router;
