import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    insurerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    treatment: {
      type: String,
      required: true,
    },

    diagnosis: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    coverageAmount: {
      type: Number,
      default: null,
    },

    patientResponsibility: {
      type: Number,
      default: null,
    },

    missingDocuments: [
      {
        type: String,
        trim: true,
      },
    ],

    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "verified",
        "under_review",
        "approved",
        "rejected",
      ],
      default: "submitted",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "submitted",
            "verified",
            "under_review",
            "approved",
            "rejected",
          ],
          required: true,
        },
        note: {
          type: String,
          trim: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    decisionReason: {
      type: String,
      trim: true,
    },

    verifiedAt: {
      type: Date,
    },

    reviewedAt: {
      type: Date,
    },
    policyText: {
  type: String,
  trim: true,
  default: "",
},

hospitalEstimateText: {
  type: String,
  trim: true,
  default: "",
},
  },
  {
    timestamps: true,
  }
);

const Claim = mongoose.model("Claim", claimSchema);

export default Claim;