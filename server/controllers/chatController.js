import { isValidObjectId } from "mongoose";
import Claim from "../models/Claim.js";
import ChatSession from "../models/ChatSession.js";
import { generateMediBridgeResponse } from "../services/openaiService.js";

// ---------------------------------------------------------------------------
// Helper — find-or-create the session for (userId, claimId)
// ---------------------------------------------------------------------------
const getOrCreateSession = async ({ userId, claimId, sessionName }) => {
  let session = await ChatSession.findOne({ userId, claimId });

  if (!session) {
    session = await ChatSession.create({
      userId,
      claimId,
      sessionName: sessionName || "Claim Session",
      messages: [],
      lastMessageAt: null,
    });
  }

  return session;
};

// ---------------------------------------------------------------------------
// POST /api/chat
// Send a message; persist both the user turn and the assistant reply.
// ---------------------------------------------------------------------------
export const chatWithMediBridge = async (req, res) => {
  try {
    const { claimId, message } = req.body;

    if (!claimId || !String(claimId).trim()) {
      return res.status(400).json({ message: "claimId is required" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!isValidObjectId(claimId)) {
      return res.status(400).json({ message: "Invalid claim ID" });
    }

    const claim = await Claim.findById(claimId);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Build a session name from the uploaded filenames when available
    const sessionName = buildSessionName(claim);

    // Get (or create) the persistent session for this user + claim
    // req.user may be undefined when the chat route is called without auth
    // (the current chatRoutes do not apply protect middleware).
    // We use a fallback so anonymous sessions are still stored per-claim.
    const userId = req.user?._id ?? null;

    let session = null;

    if (userId) {
      session = await getOrCreateSession({ userId, claimId, sessionName });

      // Update name if it changed (e.g. files were re-uploaded with new names)
      if (session.sessionName !== sessionName) {
        session.sessionName = sessionName;
      }
    }

    // --- call the AI ---
    const result = await generateMediBridgeResponse({
      message: message.trim(),
      context: {
        policyText: claim.policyText,
        estimateText: claim.hospitalEstimateText,
      },
    });

    // Persist both turns
    if (session) {
      session.messages.push(
        { role: "user",      content: message.trim()  },
        { role: "assistant", content: result.reply     }
      );
      session.lastMessageAt = new Date();
      await session.save();
    }

    return res.json({ reply: result.reply });
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

    return res.status(isUpstreamFailure ? 502 : 500).json({
      message: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/chat/sessions
// Return all chat sessions for the authenticated user, newest first.
// Each item carries enough data to populate the sidebar (no message bodies).
// ---------------------------------------------------------------------------
export const listChatSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .select("-messages") // exclude heavy message array from list
      .populate("claimId", "policyFileName estimateFileName analysisStatus analysis");

    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/chat/:claimId/history
// Return the full message history for one (user, claim) session.
// ---------------------------------------------------------------------------
export const getChatHistory = async (req, res) => {
  try {
    const { claimId } = req.params;

    if (!isValidObjectId(claimId)) {
      return res.status(400).json({ message: "Invalid claim ID" });
    }

    const session = await ChatSession.findOne({
      userId: req.user._id,
      claimId,
    }).populate("claimId", "policyFileName estimateFileName analysisStatus analysis");

    if (!session) {
      // No session yet — return an empty history rather than 404
      return res.json({ messages: [], session: null });
    }

    return res.json({
      messages: session.messages,
      session: {
        _id: session._id,
        claimId: session.claimId,
        sessionName: session.sessionName,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------
const buildSessionName = (claim) => {
  const policy   = claim.policyFileName?.replace(/\.pdf$/i, "").trim();
  const estimate = claim.estimateFileName?.replace(/\.pdf$/i, "").trim();

  if (policy && estimate) return `${policy} · ${estimate}`;
  if (policy)             return policy;
  if (estimate)           return estimate;

  return "Claim Session";
};
