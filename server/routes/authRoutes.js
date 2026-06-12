import express from "express";
import { protect } from "../middlewear/authMiddlewear.js";

import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", registerUser);
router.get("/me", protect, getCurrentUser);
router.post("/login", loginUser);

export default router;