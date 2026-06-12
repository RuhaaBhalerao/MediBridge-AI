const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthHeaders = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

export const sendChatMessage = async ({
  message,
  policyText,
  hospitalEstimateText,
}) => {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      policyText,
      hospitalEstimateText,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to send message");
  }

  return data;
};

export const getCurrentUser = async (token) => {
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};

export const getMyClaims = async (token) => {
  if (!token) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/api/claims/my`, {
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data?.claims) ? data.claims : [];
};