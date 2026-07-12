import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const chatSessionSchema = new mongoose.Schema(
  {
    // The claim this chat belongs to
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
    },

    // The user who owns this session
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Human-readable name derived from the uploaded filenames,
    // e.g. "mock_insurance_policy.pdf – mock_hospital_estimate.pdf"
    sessionName: {
      type: String,
      trim: true,
      default: "Claim Session",
    },

    // Full ordered conversation history
    messages: {
      type: [messageSchema],
      default: [],
    },

    // When the last message was sent — used for sidebar ordering
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One session per (user, claim) pair — enforced at the DB level
chatSessionSchema.index({ userId: 1, claimId: 1 }, { unique: true });

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
