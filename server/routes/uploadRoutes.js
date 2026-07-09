import express from "express";
import { protect, authorize } from "../middlewear/authMiddlewear.js";
import { analyzeClaimDocuments, uploadDocument, getDocumentsByClaim } from "../controllers/uploadController.js";
import { uploadPdfDocuments } from "../middlewear/uploadMiddleware.js";

const router = express.Router();

router.post("/", uploadPdfDocuments, uploadDocument);
router.post("/:claimId/analyze", analyzeClaimDocuments);
router.get("/:claimId", protect, authorize("patient", "hospital", "insurer"), getDocumentsByClaim);

export default router;
