import { isValidObjectId } from "mongoose";
import Claim from "../models/Claim.js";
import { generateMediBridgeResponse } from "../services/openaiService.js";

export const chatWithMediBridge = async (req, res) => {
  try {
    const { claimId, message } = req.body;

    if (!claimId || !String(claimId).trim()) {
      return res.status(400).json({
        message: "claimId is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    if (!isValidObjectId(claimId)) {
      return res.status(400).json({
        message: "Invalid claim ID",
      });
    }

    const claim = await Claim.findById(claimId);

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    const result = await generateMediBridgeResponse({
      message: message.trim(),
      context: {
        policyText: claim.policyText,
        estimateText: claim.hospitalEstimateText,
      },
    });

    res.json({
      reply: result.reply,
    });
  } catch (error) {
    console.error("chatWithMediBridge failed:", {
      message: error?.message,
      stack: error?.stack,
    });

    const isUpstreamFailure =
      typeof error?.message === "string" &&
      (error.message.includes("OpenRouter") ||
        error.message.includes("Network error") ||
        error.message.includes("OPENROUTER_API_KEY"));

    res.status(isUpstreamFailure ? 502 : 500).json({
      message: error.message,
    });
  }
};