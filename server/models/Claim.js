import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      trim: true,
      default: "",
    },

    diagnosis: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      default: 0,
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

    policyFileName: {
      type: String,
      trim: true,
      default: "",
    },

    estimateFileName: {
      type: String,
      trim: true,
      default: "",
    },

    analysisStatus: {
      type: String,
      enum: ["pending", "complete", "failed"],
      default: "pending",
    },

    analysisError: {
      type: String,
      trim: true,
      default: "",
    },

    analysis: {
      costBreakdown: {
        totalEstimate: {
          type: Number,
          default: null,
        },
        estimatedCoverage: {
          type: Number,
          default: null,
        },
        estimatedPatientCost: {
          type: Number,
          default: null,
        },
      },
      coverageClarity: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: null,
        },
        status: {
          type: String,
          trim: true,
          default: "unclear",
        },
        reason: {
          type: String,
          trim: true,
          default: "",
        },
      },
      coverageFlags: [
        {
          type: {
            type: String,
            trim: true,
            enum: ["positive", "warning", "risk"],
            default: "warning",
          },
          title: {
            type: String,
            trim: true,
            default: "",
          },
          reason: {
            type: String,
            trim: true,
            default: "",
          },
        },
      ],
      claimReadiness: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: null,
        },
        checks: [
          {
            label: {
              type: String,
              trim: true,
              default: "",
            },
            status: {
              type: String,
              trim: true,
              enum: ["complete", "unclear", "missing"],
              default: "unclear",
            },
          },
        ],
      },
      nextAction: {
        title: {
          type: String,
          trim: true,
          default: "",
        },
        reason: {
          type: String,
          trim: true,
          default: "",
        },
      },
      generatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Claim = mongoose.model("Claim", claimSchema);

export default Claim;
