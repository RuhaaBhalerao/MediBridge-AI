import { generateMediBridgeResponse } from "../services/openaiService.js";

export const chatWithMediBridge = async (req, res) => {
  try {
    const {
      message,
      policyText,
      hospitalEstimateText,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const result = await generateMediBridgeResponse({
      message,
      context: {
        policyText,
        estimateText: hospitalEstimateText,
      },
    });

    res.json({
      reply: result.reply,
      usedFallback: result.usedFallback,
    });
  } catch (error) {
    console.error("chatWithMediBridge failed:", {
      message: error?.message,
      stack: error?.stack,
    });

    res.status(500).json({
      message: error.message,
    });
  }
};