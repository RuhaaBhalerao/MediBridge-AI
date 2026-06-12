
import Document from "../models/Document.js";
import { createNotification } from "../services/notificationService.js";
import { logAuditAction } from "../services/auditService.js";

const buildClaimFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.hospitalId) {
    filter.hospitalId = query.hospitalId;
  }

  if (query.insurerId) {
    filter.insurerId = query.insurerId;
  }

  if (query.search) {
    const searchTerm = query.search.trim();
    filter.$or = [
      { treatment: { $regex: searchTerm, $options: "i" } },
      { diagnosis: { $regex: searchTerm, $options: "i" } },
    ];
  }

  if (query.minAmount || query.maxAmount) {
    filter.amount = {};

    if (query.minAmount) {
      filter.amount.$gte = Number(query.minAmount);
    }

    if (query.maxAmount) {
      filter.amount.$lte = Number(query.maxAmount);
    }
  }

  return filter;
};

const claimPopulation = [
  { path: "patientId", select: "name email role" },
  { path: "hospitalId", select: "name email role" },
  { path: "insurerId", select: "name email role" },
  { path: "verifiedBy", select: "name email role" },
  { path: "reviewedBy", select: "name email role" },
];

const canAccessClaim = (claim, user) => {
  if (!claim || !user) {
    return false;
  }

  if (user.role === "patient") {
    return claim.patientId && claim.patientId.toString() === user._id.toString();
  }

  if (user.role === "hospital") {
    return !claim.hospitalId || claim.hospitalId.toString() === user._id.toString();
  }

  if (user.role === "insurer") {
    return !claim.insurerId || claim.insurerId.toString() === user._id.toString();
  }

  return false;
};

export const createClaim = async (req, res) => {
  try {
    const {
  treatment,
  diagnosis,
  amount,
  hospitalId,
  insurerId,
  coverageAmount,
  patientResponsibility,
  missingDocuments,
  confidenceScore,
  policyText,
  hospitalEstimateText,
} = req.body;

    if (!treatment || !diagnosis || amount === undefined) {
      return res.status(400).json({
        message: "Treatment, diagnosis, and amount are required",
      });
    }

    const claim = await Claim.create({
      patientId: req.user._id,
      hospitalId: hospitalId || undefined,
      insurerId: insurerId || undefined,
      treatment,
      diagnosis,
      policyText: policyText || "",
hospitalEstimateText: hospitalEstimateText || "",
      amount: Number(amount),
      coverageAmount: coverageAmount === undefined || coverageAmount === null || coverageAmount === "" ? null : Number(coverageAmount),
      patientResponsibility:
        patientResponsibility === undefined || patientResponsibility === null || patientResponsibility === ""
          ? null
          : Number(patientResponsibility),
      missingDocuments: Array.isArray(missingDocuments)
        ? missingDocuments.filter((document) => typeof document === "string" && document.trim()).map((document) => document.trim())
        : [],
      confidenceScore:
        confidenceScore === undefined || confidenceScore === null || confidenceScore === ""
          ? null
          : Number(confidenceScore),
      status: "submitted",
      statusHistory: [
        {
          status: "submitted",
          note: "Claim submitted",
          changedBy: req.user._id,
        },
      ],
    });

    if (claim.hospitalId) {
      await createNotification({
        recipientId: claim.hospitalId,
        senderId: req.user._id,
        claimId: claim._id,
        type: "claim_created",
        title: "New claim submitted",
        message: `A new claim was submitted for ${claim.diagnosis}`,
      });
    }

    if (claim.insurerId) {
      await createNotification({
        recipientId: claim.insurerId,
        senderId: req.user._id,
        claimId: claim._id,
        type: "claim_created",
        title: "Claim ready for review",
        message: `A claim was submitted for ${claim.diagnosis}`,
      });
    }

    await logAuditAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "claim_created",
      entityType: "Claim",
      entityId: claim._id,
      claimId: claim._id,
      metadata: {
        treatment,
        diagnosis,
        amount: Number(amount),
        coverageAmount:
          coverageAmount === undefined || coverageAmount === null || coverageAmount === ""
            ? null
            : Number(coverageAmount),
        patientResponsibility:
          patientResponsibility === undefined || patientResponsibility === null || patientResponsibility === ""
            ? null
            : Number(patientResponsibility),
        missingDocuments: Array.isArray(missingDocuments)
          ? missingDocuments.filter((document) => typeof document === "string" && document.trim()).map((document) => document.trim())
          : [],
        confidenceScore:
          confidenceScore === undefined || confidenceScore === null || confidenceScore === ""
            ? null
            : Number(confidenceScore),
      },
    });

    const populatedClaim = await Claim.findById(claim._id).populate(claimPopulation);

    res.status(201).json({
      message: "Claim created successfully",
      claim: populatedClaim,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .populate(claimPopulation);

    res.json({ claims });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllClaims = async (req, res) => {
  try {
    const filter = buildClaimFilter(req.query);
    const claims = await Claim.find(filter)
      .sort({ createdAt: -1 })
      .populate(claimPopulation);

    res.json({ claims });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate(claimPopulation);

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

    res.json({ claim });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const verifyClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    if (claim.status === "approved" || claim.status === "rejected") {
      return res.status(400).json({
        message: "Finalized claims cannot be verified again",
      });
    }

    claim.status = "verified";
    claim.verifiedBy = req.user._id;
    claim.verifiedAt = new Date();
    claim.statusHistory = claim.statusHistory || [];
    claim.statusHistory.push({
      status: "verified",
      note: "Verified by hospital",
      changedBy: req.user._id,
    });
    await claim.save();

    if (claim.patientId) {
      await createNotification({
        recipientId: claim.patientId,
        senderId: req.user._id,
        claimId: claim._id,
        type: "claim_verified",
        title: "Claim verified",
        message: `Your claim for ${claim.diagnosis} has been verified.`,
      });
    }

    await logAuditAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "claim_verified",
      entityType: "Claim",
      entityId: claim._id,
      claimId: claim._id,
    });

    const populatedClaim = await Claim.findById(claim._id).populate(claimPopulation);

    res.json({
      message: "Claim verified successfully",
      claim: populatedClaim,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const decideClaim = async (req, res) => {
  try {
    const { decision, reason } = req.body;
    const nextStatus = decision || req.body.status;

    if (!["approved", "rejected"].includes(nextStatus)) {
      return res.status(400).json({
        message: "Decision must be approved or rejected",
      });
    }

    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    claim.status = nextStatus;
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    claim.decisionReason = reason || "";
    claim.statusHistory = claim.statusHistory || [];
    claim.statusHistory.push({
      status: nextStatus,
      note: reason || `Claim ${nextStatus}`,
      changedBy: req.user._id,
    });
    await claim.save();

    if (claim.patientId) {
      await createNotification({
        recipientId: claim.patientId,
        senderId: req.user._id,
        claimId: claim._id,
        type: "claim_decision",
        title: `Claim ${nextStatus}`,
        message: `Your claim for ${claim.diagnosis} was ${nextStatus}.`,
      });
    }

    await logAuditAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: `claim_${nextStatus}`,
      entityType: "Claim",
      entityId: claim._id,
      claimId: claim._id,
      metadata: { reason: reason || "" },
    });

    const populatedClaim = await Claim.findById(claim._id).populate(claimPopulation);

    res.json({
      message: `Claim ${nextStatus} successfully`,
      claim: populatedClaim,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getClaimDocuments = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

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

    const documents = await Document.find({ claimId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email role");

    res.json({ documents });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};