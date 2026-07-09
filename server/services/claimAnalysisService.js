import { callOpenRouterChatCompletion } from "./openaiService.js";

const CLAIM_ANALYSIS_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free";

const ANALYSIS_SCHEMA_DESCRIPTION = `
Return only valid JSON with this exact top-level shape:
{
  "costBreakdown": {
    "totalEstimate": number | null,
    "estimatedCoverage": number | null,
    "estimatedPatientCost": number | null
  },
  "coverageClarity": {
    "score": number | null,
    "status": "Likely Covered" | "Partially Covered" | "Not Covered" | "unclear",
    "reason": string
  },
  "coverageFlags": [
    {
      "type": "positive" | "warning" | "risk",
      "title": string,
      "reason": string
    }
  ],
  "claimReadiness": {
    "score": number | null,
    "checks": [
      {
        "label": string,
        "status": "complete" | "unclear" | "missing"
      }
    ]
  },
  "nextAction": {
    "title": string,
    "reason": string
  }
}
`;

const stripJsonCodeFences = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
};

const extractJsonCandidate = (value) => {
  const cleaned = stripJsonCodeFences(value);

  if (!cleaned) {
    return "";
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
};

const normalizeNumber = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
};

const normalizeString = (value, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const normalizeScore = (value) => {
  const numericValue = normalizeNumber(value);

  if (numericValue === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const normalizeCoverageClarityStatus = (value) => {
  const allowedStatuses = new Set(["Likely Covered", "Partially Covered", "Not Covered", "unclear"]);
  const normalized = normalizeString(value, "unclear");

  return allowedStatuses.has(normalized) ? normalized : "unclear";
};

const normalizeCheckStatus = (value) => {
  const allowedStatuses = new Set(["complete", "unclear", "missing"]);
  const normalized = normalizeString(value, "unclear");

  return allowedStatuses.has(normalized) ? normalized : "unclear";
};

const normalizeFlagType = (value) => {
  const allowedTypes = new Set(["positive", "warning", "risk"]);
  const normalized = normalizeString(value, "warning");

  return allowedTypes.has(normalized) ? normalized : "warning";
};

const normalizeAnalysis = (analysis) => {
  const coverageFlags = Array.isArray(analysis?.coverageFlags)
    ? analysis.coverageFlags
        .filter(Boolean)
        .map((flag) => ({
          type: normalizeFlagType(flag?.type),
          title: normalizeString(flag?.title),
          reason: normalizeString(flag?.reason),
        }))
    : [];

  const checks = Array.isArray(analysis?.claimReadiness?.checks)
    ? analysis.claimReadiness.checks
        .filter(Boolean)
        .map((check) => ({
          label: normalizeString(check?.label),
          status: normalizeCheckStatus(check?.status),
        }))
    : [];

  return {
    costBreakdown: {
      totalEstimate: normalizeNumber(analysis?.costBreakdown?.totalEstimate),
      estimatedCoverage: normalizeNumber(analysis?.costBreakdown?.estimatedCoverage),
      estimatedPatientCost: normalizeNumber(analysis?.costBreakdown?.estimatedPatientCost),
    },
    coverageClarity: {
      score: normalizeScore(analysis?.coverageClarity?.score),
      status: normalizeCoverageClarityStatus(analysis?.coverageClarity?.status),
      reason: normalizeString(analysis?.coverageClarity?.reason),
    },
    coverageFlags,
    claimReadiness: {
      score: normalizeScore(analysis?.claimReadiness?.score),
      checks,
    },
    nextAction: {
      title: normalizeString(analysis?.nextAction?.title),
      reason: normalizeString(analysis?.nextAction?.reason),
    },
  };
};

const buildClaimAnalysisMessages = ({ policyText, hospitalEstimateText }) => [
  {
    role: "system",
    content: [
      "You are MediBridge AI. Analyze the uploaded insurance policy and hospital estimate.",
      "Use ONLY the provided policyText and hospitalEstimateText.",
      "Do not invent facts, prices, clauses, limits, exclusions, deductibles, or pre-authorization requirements.",
      "If a value cannot be determined, use null or 'unclear' instead of guessing.",
      "Coverage clarity is not approval probability.",
      "Use cautious wording such as appears, likely, may, based on the uploaded documents, or could not determine.",
      "Return strict JSON only. Do not include markdown, comments, or code fences.",
      ANALYSIS_SCHEMA_DESCRIPTION.trim(),
    ].join("\n"),
  },
  {
    role: "user",
    content: [
      "policyText:",
      policyText || "",
      "",
      "hospitalEstimateText:",
      hospitalEstimateText || "",
    ].join("\n"),
  },
];

export const generateClaimAnalysis = async ({ policyText, hospitalEstimateText }) => {
  const trimmedPolicyText = typeof policyText === "string" ? policyText.trim() : "";
  const trimmedEstimateText = typeof hospitalEstimateText === "string" ? hospitalEstimateText.trim() : "";

  if (!trimmedPolicyText || !trimmedEstimateText) {
    throw new Error("Both policy text and hospital estimate text are required for claim analysis.");
  }

  const response = await callOpenRouterChatCompletion({
    model: CLAIM_ANALYSIS_MODEL,
    temperature: 0.1,
    messages: buildClaimAnalysisMessages({
      policyText: trimmedPolicyText,
      hospitalEstimateText: trimmedEstimateText,
    }),
  });

  const rawAnalysis = response?.choices?.[0]?.message?.content || "";
  const jsonCandidate = extractJsonCandidate(rawAnalysis);

  if (!jsonCandidate) {
    throw new Error("OpenRouter returned an empty claim analysis response.");
  }

  let parsedAnalysis;

  try {
    parsedAnalysis = JSON.parse(jsonCandidate);
  } catch (error) {
    console.error("[CLAIM ANALYSIS] Invalid JSON returned by OpenRouter:", rawAnalysis);
    throw new Error("OpenRouter returned invalid claim analysis JSON.");
  }

  return normalizeAnalysis(parsedAnalysis);
};