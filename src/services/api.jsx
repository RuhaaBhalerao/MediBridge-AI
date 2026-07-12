const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getStoredAuthToken = () => {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("medibridgeToken") ||
    ""
  );
};

const getAuthHeaders = (token = getStoredAuthToken()) =>
  token ? { Authorization: `Bearer ${token}` } : {};

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
};

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export const sendChatMessage = async ({ claimId, message }) => {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // include auth so the server can persist the turn to ChatSession
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ claimId, message }),
  });
  return parseResponse(response);
};

/**
 * List all chat sessions for the logged-in user.
 * Returns an array of session objects (messages array excluded).
 * Each item includes: _id, sessionName, lastMessageAt, claimId (populated).
 */
export const fetchChatSessions = async () => {
  const token = getStoredAuthToken();
  if (!token) return [];

  const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data?.sessions) ? data.sessions : [];
};

/**
 * Fetch the full message history for one claim session.
 * Returns { messages: [...], session: {...} }
 */
export const fetchChatHistory = async (claimId) => {
  const token = getStoredAuthToken();
  if (!token || !claimId) return { messages: [], session: null };

  const response = await fetch(
    `${API_BASE_URL}/api/chat/${claimId}/history`,
    { headers: getAuthHeaders(token) }
  );

  if (!response.ok) return { messages: [], session: null };
  return response.json();
};

// ---------------------------------------------------------------------------
// Upload / Analysis
// ---------------------------------------------------------------------------

export const uploadClaimDocuments = async ({ policyFile, estimateFile, claimId }) => {
  const formData = new FormData();
  if (claimId) formData.append("claimId", claimId);
  formData.append("policy", policyFile);
  formData.append("estimate", estimateFile);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  return parseResponse(response);
};

export const retryClaimAnalysis = async (claimId) => {
  const response = await fetch(`${API_BASE_URL}/api/upload/${claimId}/analyze`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
};

// ---------------------------------------------------------------------------
// Auth / User
// ---------------------------------------------------------------------------

export const getCurrentUser = async (token) => {
  const authToken = token || getStoredAuthToken();
  if (!authToken) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders(authToken),
  });
  if (!response.ok) return null;
  return response.json();
};

export const getMyClaims = async (token) => {
  const authToken = token || getStoredAuthToken();
  if (!authToken) return [];

  const response = await fetch(`${API_BASE_URL}/api/claims/my`, {
    headers: getAuthHeaders(authToken),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data?.claims) ? data.claims : [];
};
