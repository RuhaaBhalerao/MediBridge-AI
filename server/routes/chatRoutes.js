import express from "express";
import { chatWithMediBridge } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", chatWithMediBridge);

export default router;