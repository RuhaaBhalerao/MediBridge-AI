import express from "express";
import {
  createClaim,
  getAllClaims,
  getMyClaims,
  getClaimById,
  verifyClaim,
  decideClaim,
  getClaimDocuments,
} from "../controllers/claimController.js";
import { protect, authorize } from "../middlewear/authMiddlewear.js";

const router = express.Router();

router.post("/", protect, authorize("patient"), createClaim);
router.get("/my", protect, authorize("patient"), getMyClaims);
router.get("/", protect, authorize("hospital", "insurer"), getAllClaims);
router.get("/:id", protect, authorize("patient", "hospital", "insurer"), getClaimById);
router.patch("/:id/verify", protect, authorize("hospital"), verifyClaim);
router.patch("/:id/decision", protect, authorize("insurer"), decideClaim);
router.get("/:id/documents", protect, authorize("patient", "hospital", "insurer"), getClaimDocuments);

export default router;