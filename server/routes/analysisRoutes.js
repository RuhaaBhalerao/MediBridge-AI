import express from "express";
import { protect, authorize } from "../middlewear/authMiddlewear.js";
import {
	getPatientDashboard,
	getHospitalDashboard,
	getInsurerDashboard,
} from "../controllers/analysisController.js";

const router = express.Router();

router.get("/patient", protect, authorize("patient"), getPatientDashboard);
router.get("/hospital", protect, authorize("hospital"), getHospitalDashboard);
router.get("/insurer", protect, authorize("insurer"), getInsurerDashboard);

export default router;
