import Claim from "../models/Claim.js";
import Document from "../models/Document.js";
import { createNotification } from "../services/notificationService.js";
import { logAuditAction } from "../services/auditService.js";

const canAccessClaim = (claim, user) => {
	if (!claim || !user) {
		return false;
	}

	if (user.role === "patient") {
		return claim.patientId.toString() === user._id.toString();
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
		const { claimId, fileName, fileUrl, fileType, notes } = req.body;

		if (!claimId || !fileName || !fileUrl) {
			return res.status(400).json({
				message: "claimId, fileName, and fileUrl are required",
			});
		}

		const claim = await Claim.findById(claimId);

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

		const document = await Document.create({
			claimId,
			uploadedBy: req.user._id,
			fileName,
			fileUrl,
			fileType,
			notes,
		});

		if (claim.patientId) {
			await createNotification({
				recipientId: claim.patientId,
				senderId: req.user._id,
				claimId: claim._id,
				type: "document_uploaded",
				title: "New document uploaded",
				message: `A new document was uploaded for ${claim.diagnosis}.`,
			});
		}

		await logAuditAction({
			actorId: req.user._id,
			actorRole: req.user.role,
			action: "document_uploaded",
			entityType: "Document",
			entityId: document._id,
			claimId: claim._id,
			metadata: {
				fileName,
				fileType: fileType || "",
			},
		});

		res.status(201).json({
			message: "Document uploaded successfully",
			document,
		});
	} catch (error) {
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
