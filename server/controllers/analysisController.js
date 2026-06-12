import Claim from "../models/Claim.js";

export const getPatientDashboard = async (req, res) => {
	try {
		const patientId = req.user._id;

		const [totalClaims, approvedClaims, rejectedClaims, pendingClaims, recentClaims] =
			await Promise.all([
				Claim.countDocuments({ patientId }),
				Claim.countDocuments({ patientId, status: "approved" }),
				Claim.countDocuments({ patientId, status: "rejected" }),
				Claim.countDocuments({
					patientId,
					status: { $in: ["submitted", "verified", "under_review"] },
				}),
				Claim.find({ patientId }).sort({ createdAt: -1 }).limit(5),
			]);

		res.json({
			totalClaims,
			approvedClaims,
			rejectedClaims,
			pendingClaims,
			recentClaims,
		});
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
};

export const getHospitalDashboard = async (req, res) => {
	try {
		const [submittedClaims, verifiedClaims, reviewClaims, totalClaims] = await Promise.all([
			Claim.countDocuments({ status: "submitted" }),
			Claim.countDocuments({ status: "verified" }),
			Claim.countDocuments({ status: { $in: ["under_review", "verified"] } }),
			Claim.countDocuments({}),
		]);

		res.json({
			submittedClaims,
			verifiedClaims,
			reviewClaims,
			totalClaims,
		});
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
};

export const getInsurerDashboard = async (req, res) => {
	try {
		const [approvedClaims, rejectedClaims, pendingReviews, totalClaims] = await Promise.all([
			Claim.countDocuments({ status: "approved" }),
			Claim.countDocuments({ status: "rejected" }),
			Claim.countDocuments({ status: { $in: ["verified", "under_review"] } }),
			Claim.countDocuments({}),
		]);

		res.json({
			approvedClaims,
			rejectedClaims,
			pendingReviews,
			totalClaims,
		});
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
};
