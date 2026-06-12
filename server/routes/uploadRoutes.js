import express from "express";
import { protect, authorize } from "../middlewear/authMiddlewear.js";
import { uploadDocument, getDocumentsByClaim } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/upload", protect, authorize("patient", "hospital", "insurer"), uploadDocument);
router.get("/:claimId", protect, authorize("patient", "hospital", "insurer"), getDocumentsByClaim);

export default router;
