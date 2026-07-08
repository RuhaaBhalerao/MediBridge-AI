import express from "express";
import { protect, authorize } from "../middlewear/authMiddlewear.js";
import { uploadDocument, getDocumentsByClaim } from "../controllers/uploadController.js";
import { uploadPdfDocuments } from "../middlewear/uploadMiddleware.js";

const router = express.Router();

router.post("/", uploadPdfDocuments, uploadDocument);
router.get("/:claimId", protect, authorize("patient", "hospital", "insurer"), getDocumentsByClaim);

export default router;
