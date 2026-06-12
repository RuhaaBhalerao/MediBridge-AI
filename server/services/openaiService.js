export const getMediBridgeSystemPrompt = async () => {
	const mod = await import("../config/systemPrompt.js");
	return mod.MEDIBRIDGE_SYSTEM_PROMPT;
};

const normalizeClaimValue = (value) => {
	if (Array.isArray(value)) {
		return value.length ? value.map(normalizeClaimValue).join(", ") : "Not provided";
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (value === null || value === undefined || value === "") {
		return "Not provided";
	}

	if (typeof value === "object") {
		return JSON.stringify(value);
	}

	return String(value);
};




const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];;

const callGeminiWithModel = async ({ model, message, history = [], context = {}, promptText = "" }) => {
	const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
	if (!GEMINI_API_KEY) {
		console.log("callGemini: no GEMINI_API_KEY present");
		return null;
	}

	if (promptText) {
		console.log("callGemini: using model", model);
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

		const body = {
			contents: [
				{
					role: "user",
					parts: [{ text: promptText }],
				},
			],
			generationConfig: {
				maxOutputTokens: 800,
				temperature: 0.2,
		},
		};

		const resp = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!resp.ok) {
			const txt = await resp.text();
			console.error("Gemini HTTP error:", resp.status, txt);
			throw new Error(`Gemini request failed: ${resp.status} ${txt}`);
		}

		const data = await resp.json();
		const candidate = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || data?.candidates?.[0]?.content || data?.output?.[0]?.content || data?.outputs?.[0]?.content?.text || data?.output_text;
		console.log("Gemini response raw:", Object.keys(data || {}).join(","));
		if (typeof candidate === "string") {
			console.log("Gemini candidate (truncated):", candidate.slice(0, 200));
			return candidate.trim();
		}

		if (data?.candidates && data.candidates.length) return JSON.stringify(data.candidates[0]);
		return null;
	}

	console.log("callGemini: using model", model);

	
	
	const promptParts = [systemPrompt];
	if (contextMessage) promptParts.push(`Context:\n${contextMessage}`);
	if (Array.isArray(history) && history.length) {
		const recent = history
			.slice(-8)
			.map((h) => `${h.role || "user"}: ${h.content}`)
			.join("\n");
		promptParts.push(`Conversation history:\n${recent}`);
	}
	promptParts.push(`User: ${message}`);

	const generatedPromptText = promptParts.join("\n\n");

	const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText`;

	const body = {
		prompt: { text: generatedPromptText },
		temperature: 0.3,
		maxOutputTokens: 800,
	};

	const resp = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${GEMINI_API_KEY}`,
		},
		body: JSON.stringify(body),
	});

	if (!resp.ok) {
		const txt = await resp.text();
		console.error("Gemini HTTP error:", resp.status, txt);
		throw new Error(`Gemini request failed: ${resp.status} ${txt}`);
	}

	const data = await resp.json();

	// Try common response shapes
	const candidate = data?.candidates?.[0]?.content || data?.output?.[0]?.content || data?.outputs?.[0]?.content?.text || data?.output_text;
	console.log("Gemini response raw:", Object.keys(data || {}).join(","));
	if (typeof candidate === "string") {
		console.log("Gemini candidate (truncated):", candidate.slice(0, 200));
		return candidate.trim();
	}

	// Fallback: attempt to stringify useful fields
	if (data?.candidates && data.candidates.length) return JSON.stringify(data.candidates[0]);
	return null;
};

const callGemini = async ({ message, history = [], context = {}, promptText = "" }) => {
	for (const model of GEMINI_MODELS) {
		try {
			const reply = await callGeminiWithModel({
				model,
				message,
				history,
				context,
				promptText,
			});

			if (reply) {
				return reply;
			}
		} catch (error) {
			const errorMessage = error?.message || "";
			if (!errorMessage.includes("503") || model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
				throw error;
			}

			console.warn(`Gemini model ${model} returned 503, trying next model`);
		}
	}

	return null;
};

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const normalizeHistory = (history = []) =>
	history
		.filter((entry) => entry && typeof entry.content === "string")
		.slice(-8)
		.map((entry) => ({
			role: ["system", "assistant", "user"].includes(entry.role) ? entry.role : "user",
			content: entry.content.trim(),
		}));

const buildContextMessage = (context = {}) => {
	const sections = [];

	if (context.policyText) {
		sections.push(`Insurance policy:\n${context.policyText}`);
	}

	if (context.estimateText) {
		sections.push(`Hospital estimate:\n${context.estimateText}`);
	}

	if (context.analysisSummary) {
		sections.push(`Current analysis summary:\n${context.analysisSummary}`);
	}

	if (context.coverageAmount || context.patientResponsibility || context.patientPays || context.confidenceScore || context.confidence) {
		sections.push(
			[
				context.coverageAmount ? `Estimated coverage: ${context.coverageAmount}` : null,
				context.patientResponsibility ? `Estimated patient payment: ${context.patientResponsibility}` : context.patientPays ? `Estimated patient payment: ${context.patientPays}` : null,
				context.confidenceScore ? `Coverage confidence: ${context.confidenceScore}` : context.confidence ? `Coverage confidence: ${context.confidence}` : null,
			]
				.filter(Boolean)
				.join("\n")
		);
	}

	return sections.filter(Boolean).join("\n\n");
};

const buildFallbackReply = ({ message, context }) => {
	const contextMessage = buildContextMessage(context);

	if (contextMessage) {
		return [
			"I can help explain the available coverage information, but I am not connected to the live AI model right now.",
			"",
			"Relevant context:",
			contextMessage,
			"",
			"If you want, I can still help you break this down into coverage, personal payment, exclusions, and next steps.",
		].join("\n");
	}

	if (message.toLowerCase().includes("claim")) {
		return "I can help with claim steps, required documents, and what to upload. If you share the policy or estimate details, I can explain the likely process in simple terms.";
	}

	return "I can help explain insurance coverage, hospital estimates, out-of-pocket costs, and claim steps. Share your policy or estimate details, and I will guide you in simple language.";
};

export const generateMediBridgeResponse = async ({
  message,
  history = [],
  context = {},
}) => {
	const trimmedMessage = (message || "").trim();

	if (!trimmedMessage) {
		throw new Error("Message is required");
	}

	const promptText = `
You are MediBridge AI.

Insurance Policy:
${context.policyText || "Not provided"}

Hospital Estimate:
${context.estimateText || "Not provided"}

User Question:
${trimmedMessage}

Rules:
- Answer ONLY from the policy and estimate.
- Do not invent coverage.
- Do not use outside knowledge.
- If information is missing, say:
"This information is not available in the provided policy or estimate."
`;

	// If Gemini is configured prefer it; otherwise use OpenAI. If neither is available, return fallback.
	console.log("generateMediBridgeResponse: GEMINI key present?", !!process.env.GEMINI_API_KEY, "OPENAI key present?", !!process.env.OPENAI_API_KEY);
	if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
		return {
			reply: buildFallbackReply({
  message: trimmedMessage,
  context,
}),
		};
	}

	

	const messages = [
  {
    role: "system",
    content: promptText,
  },
  {
    role: "user",
    content: trimmedMessage,
  },
];

	// Try Gemini first when configured
	if (process.env.GEMINI_API_KEY) {
		try {
			const gReply = await callGemini({
				message: trimmedMessage,
				history,
				context,
				promptText,
			});
			if (gReply) {
				return { reply: gReply, usedFallback: false, provider: "gemini" };
			}
		} catch (gErr) {
			console.error("Gemini call failed, falling back to OpenAI:", gErr);
		}
	}

	// Fall back to OpenAI if configured
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return {
			reply: buildFallbackReply({ message: trimmedMessage, context }),
			usedFallback: true,
		};
	}

	const response = await fetch(OPENAI_CHAT_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: DEFAULT_MODEL,
			temperature: 0.3,
			messages,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
	}

	const data = await response.json();
	const reply = data?.choices?.[0]?.message?.content?.trim();

	if (!reply) {
		throw new Error("OpenAI returned an empty response");
	}

	return {
		reply,
		usedFallback: false,
		provider: "openai",
	};
};
