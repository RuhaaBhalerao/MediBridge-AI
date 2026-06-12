import AuditLog from "../models/AuditLog.js";
import Claim from "../models/Claim.js";

export const getAuditLogs = async (req, res) => {
  try {
    const filter = {};

    if (req.query.claimId) {
      filter.claimId = req.query.claimId;
    }

    if (req.query.action) {
      filter.action = req.query.action;
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .populate("actorId", "name email role")
      .populate("claimId", "diagnosis treatment status");

    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getClaimAuditTrail = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    const logs = await AuditLog.find({ claimId: req.params.claimId })
      .sort({ createdAt: -1 })
      .populate("actorId", "name email role");

    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};