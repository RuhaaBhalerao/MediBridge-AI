const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("medibridgeToken") ||
    ""
  );
};

const getAuthHeaders = (token = getStoredAuthToken()) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

export const sendChatMessage = async ({
  claimId,
  message,
}) => {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      claimId,
      message,
    }),
  });

  return parseResponse(response);
};

export const uploadClaimDocuments = async ({
  policyFile,
  estimateFile,
  claimId,
}) => {
  const formData = new FormData();

  if (claimId) {
    formData.append("claimId", claimId);
  }

  formData.append("policy", policyFile);
  formData.append("estimate", estimateFile);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
};

export const retryClaimAnalysis = async (claimId) => {
  const response = await fetch(`${API_BASE_URL}/api/upload/${claimId}/analyze`, {
    method: "POST",
  });

  return parseResponse(response);
};

export const getCurrentUser = async (token) => {
  const authToken = token || getStoredAuthToken();

  if (!authToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      ...getAuthHeaders(authToken),
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};

export const getMyClaims = async (token) => {
  const authToken = token || getStoredAuthToken();

  if (!authToken) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/api/claims/my`, {
    headers: {
      ...getAuthHeaders(authToken),
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data?.claims) ? data.claims : [];
};