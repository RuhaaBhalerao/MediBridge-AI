import { MEDIBRIDGE_SYSTEM_PROMPT } from "../config/systemPrompt.js";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free";

export const getMediBridgeSystemPrompt = async () => MEDIBRIDGE_SYSTEM_PROMPT;

const buildStrictSystemPrompt = ({ message, context = {} }) => {
	const policyText = context.policyText || "Not provided";
	const estimateText = context.estimateText || "Not provided";

	return [
		MEDIBRIDGE_SYSTEM_PROMPT.trim(),
		"",
		"Hard Rules For Document-Based Analysis:",
		"- Analyze ONLY the provided insurance policy and hospital estimate.",
		"- Do not assume coverage.",
		"- Do not invent policy clauses, exclusions, limits, deductibles, co-payments, or benefits.",
		"- If the answer cannot be determined from the provided text, explicitly say: \"Cannot determine from the provided documents.\"",
		"- Clearly distinguish between covered expenses, partially covered expenses, not covered expenses, and unknown or unclear expenses.",
		"- When calculating costs, show the values used for the calculation.",
		"- Clearly label estimated values as estimates.",
		"- Mention the relevant policy condition when making a coverage conclusion.",
		"- Never provide medical advice.",
		"- Never claim that the result is an official insurer decision.",
		"- State that the analysis is based only on the documents provided by the user.",
		"",
		"Insurance Policy:",
		policyText,
		"",
		"Hospital Estimate:",
		estimateText,
		"",
		"User Question:",
		message,
	].join("\n");
};

const mapOpenRouterError = (status) => {
	if (status === 401) {
		return "OpenRouter authentication failed (401). Check OPENROUTER_API_KEY.";
	}

	if (status === 402) {
		return "OpenRouter request failed due to insufficient credits or payment required (402).";
	}

	if (status === 429) {
		return "OpenRouter rate limit reached (429). Please retry shortly.";
	}

	if (status >= 500) {
		return "OpenRouter/provider is currently unavailable (5xx). Please retry later.";
	}

	return `OpenRouter request failed with status ${status}.`;
};

export const callOpenRouterChatCompletion = async ({
	messages,
	temperature = 0.2,
	model = DEFAULT_MODEL,
}) => {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY is missing in environment configuration.");
	}

	const response = await fetch(OPENROUTER_CHAT_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			messages,
			temperature,
		}),
	});

	if (!response.ok) {
		let upstreamMessage = "";
		try {
			const errorBody = await response.text();
			console.error("[OPENROUTER] Request failed:", response.status, errorBody);
			try {
				const errJson = JSON.parse(errorBody);
				upstreamMessage = errJson?.error?.message || "";
			} catch {
				upstreamMessage = errorBody || "";
			}
		} catch {
			upstreamMessage = "";
		}

		const mappedMessage = mapOpenRouterError(response.status);
		const fullMessage = upstreamMessage ? `${mappedMessage} ${upstreamMessage}` : mappedMessage;

		console.error("[OpenRouter] error:", fullMessage);
		throw new Error(fullMessage);
	}

	return response.json();
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

	const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
	console.log("[OPENROUTER] Service called");
	console.log("[OPENROUTER] Model:", process.env.OPENROUTER_MODEL);
	console.log("[OPENROUTER] API key configured:", Boolean(process.env.OPENROUTER_API_KEY));
	const systemPrompt = buildStrictSystemPrompt({
		message: trimmedMessage,
		context,
	});

	const messages = [
		{
			role: "system",
			content: systemPrompt,
		},
		{
			role: "user",
			content: trimmedMessage,
		},
	];

	try {
		console.log(`[OpenRouter] model=${model}`);
		const data = await callOpenRouterChatCompletion({
			messages,
			temperature: 0.2,
			model,
		});
		const reply = data?.choices?.[0]?.message?.content?.trim();

		if (!reply) {
			const message = "OpenRouter returned an invalid or empty response.";
			console.error("[OpenRouter] error:", message);
			throw new Error(message);
		}

		return {
			reply,
		};
	} catch (error) {
		if (error instanceof Error) {
			console.error("[OPENROUTER] Error:", error.message);
			throw error;
		}

		console.error("[OPENROUTER] Error:", "unknown network error");
		throw new Error("Network error while calling OpenRouter.");
	}
};
