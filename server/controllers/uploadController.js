import { isValidObjectId } from "mongoose";
import Claim from "../models/Claim.js";
import Document from "../models/Document.js";
import { extractTextFromPDF } from "../services/pdfService.js";

const canAccessClaim = (claim, user) => {
	if (!claim || !user) {
		return false;
	}

	if (user.role === "patient") {
		return claim.patientId?.toString() === user._id.toString();
	}

	if (user.role === "hospital") {
		return !claim.hospitalId || claim.hospitalId.toString() === user._id.toString();
	}

	if (user.role === "insurer") {
		return !claim.insurerId || claim.insurerId.toString() === user._id.toString();
	}

	return false;
};

export const uploadDocument = async (req, res) => {
	try {
		const policyFile = req.files?.policy?.[0];
		const estimateFile = req.files?.estimate?.[0];
		const requestedClaimId = req.body.claimId?.trim();

		if (!policyFile || !estimateFile) {
			return res.status(400).json({
				message: "Both insurance policy PDF and hospital estimate PDF are required",
			});
		}

		const [policyText, hospitalEstimateText] = await Promise.all([
			extractTextFromPDF(policyFile.buffer),
			extractTextFromPDF(estimateFile.buffer),
		]);

		const claimPayload = {
			policyText,
			hospitalEstimateText,
			policyFileName: policyFile.originalname,
			estimateFileName: estimateFile.originalname,
		};

		let claim;
		let updatedExistingClaim = false;

		if (requestedClaimId && isValidObjectId(requestedClaimId)) {
			claim = await Claim.findById(requestedClaimId);
		}

		if (claim) {
			updatedExistingClaim = true;
			claim.set(claimPayload);
			await claim.save();
		} else {
			claim = await Claim.create({
				...claimPayload,
				treatment: "",
				diagnosis: "",
				amount: 0,
				status: "submitted",
			});
		}

		res.status(updatedExistingClaim ? 200 : 201).json({
			success: true,
			message: "Documents uploaded and processed successfully",
			claimId: claim._id.toString(),
			policyFileName: claim.policyFileName,
			estimateFileName: claim.estimateFileName,
		});
	} catch (error) {
		if (
			typeof error?.message === "string" &&
			error.message.includes("We couldn't extract text from this PDF")
		) {
			return res.status(422).json({
				message: error.message,
			});
		}

		if (
			typeof error?.message === "string" &&
			error.message.includes("We couldn't process this PDF")
		) {
			return res.status(400).json({
				message: error.message,
			});
		}

		res.status(500).json({
			message: error.message,
		});
	}
};

export const getDocumentsByClaim = async (req, res) => {
	try {
		const claim = await Claim.findById(req.params.claimId);

		if (!claim) {
			return res.status(404).json({
				message: "Claim not found",
			});
		}

		if (!canAccessClaim(claim, req.user)) {
			return res.status(403).json({
				message: "Access denied",
			});
		}

		const documents = await Document.find({ claimId: req.params.claimId })
			.sort({ createdAt: -1 })
			.populate("uploadedBy", "name email role");

		res.json({ documents });
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
};
