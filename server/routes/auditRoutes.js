import express from "express";
import { protect, authorize } from "../middlewear/authMiddlewear.js";
import { getAuditLogs, getClaimAuditTrail } from "../controllers/auditController.js";

const router = express.Router();

router.get("/", protect, authorize("hospital", "insurer"), getAuditLogs);
router.get("/:claimId", protect, authorize("patient", "hospital", "insurer"), getClaimAuditTrail);

export default router;