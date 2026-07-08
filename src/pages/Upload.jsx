import { useEffect, useRef, useState } from "react";
import { sendChatMessage, uploadClaimDocuments } from "../services/api.jsx";

const CLAIM_SESSION_KEY = "medibridgeClaimSession";

const quickPrompts = [
  "Will my surgery be covered?",
  "How much will I have to pay?",
  "Are there any exclusions?",
  "Is the waiting period completed?",
];

const getStoredClaimSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(CLAIM_SESSION_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);

    return parsed?.claimId ? parsed : null;
  } catch {
    return null;
  }
};

const createStarterMessages = (hasClaim) => [
  {
    role: "assistant",
    content: hasClaim
      ? "Your documents are ready. Ask me anything about coverage, exclusions, limits, or out-of-pocket costs."
      : "Upload your insurance policy PDF and hospital estimate PDF to create a claim session, then ask me questions about coverage and costs.",
  },
];

const isPdfFile = (file) => {
  if (!file) {
    return false;
  }

  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
};

const formatFileSize = (sizeInBytes) => {
  if (!sizeInBytes && sizeInBytes !== 0) {
    return "";
  }

  const sizeInMb = sizeInBytes / (1024 * 1024);

  if (sizeInMb < 1) {
    const sizeInKb = sizeInBytes / 1024;
    return `${Math.round(sizeInKb)} KB`;
  }

  return `${sizeInMb.toFixed(1)} MB`;
};

function Upload() {
  const initialClaimSession = getStoredClaimSession();

  const [messages, setMessages] = useState(() =>
    createStarterMessages(Boolean(initialClaimSession?.claimId))
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const [claimSession, setClaimSession] = useState(initialClaimSession);
  const [policyFile, setPolicyFile] = useState(null);
  const [estimateFile, setEstimateFile] = useState(null);
  const [policyError, setPolicyError] = useState("");
  const [estimateError, setEstimateError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const policyInputRef = useRef(null);
  const estimateInputRef = useRef(null);

  const claimId = claimSession?.claimId || "";
  const claimReady = Boolean(claimId);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (claimSession?.claimId) {
      window.localStorage.setItem(
        CLAIM_SESSION_KEY,
        JSON.stringify(claimSession)
      );
    } else {
      window.localStorage.removeItem(CLAIM_SESSION_KEY);
    }
  }, [claimSession]);

  useEffect(() => {
    if (!isChatExpanded) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsChatExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChatExpanded]);

  const handlePolicySelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isPdfFile(file)) {
      setPolicyError("Please choose a PDF file.");
      setPolicyFile(null);
      event.target.value = "";
      return;
    }

    setPolicyError("");
    setUploadError("");
    setUploadSuccess("");
    setPolicyFile(file);
  };

  const handleEstimateSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isPdfFile(file)) {
      setEstimateError("Please choose a PDF file.");
      setEstimateFile(null);
      event.target.value = "";
      return;
    }

    setEstimateError("");
    setUploadError("");
    setUploadSuccess("");
    setEstimateFile(file);
  };

  const handleProcessDocuments = async () => {
    if (isProcessing) {
      return;
    }

    let hasValidationError = false;

    if (!policyFile) {
      setPolicyError("Insurance policy PDF is required.");
      hasValidationError = true;
    }

    if (!estimateFile) {
      setEstimateError("Hospital estimate PDF is required.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setIsProcessing(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const response = await uploadClaimDocuments({
        policyFile,
        estimateFile,
        claimId,
      });

      const nextClaimSession = {
        claimId: response.claimId,
        policyFileName: response.policyFileName || policyFile.name,
        estimateFileName: response.estimateFileName || estimateFile.name,
      };

      setClaimSession(nextClaimSession);
      setUploadSuccess(
        "Documents processed successfully. You can now ask MediBridge questions about your coverage."
      );
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content:
            "Documents processed successfully. You can now ask MediBridge questions about your coverage.",
        },
      ]);
    } catch (error) {
      setUploadError(
        error?.message || "We could not process your documents right now."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (messageText = input) => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    if (!claimReady) {
      setChatError("Upload and process both PDFs before asking document-specific questions.");
      return;
    }

    setInput("");
    setChatError("");

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: "user",
        content: trimmedMessage,
      },
    ]);

    setIsSending(true);

    try {
      const response = await sendChatMessage({
        claimId,
        message: trimmedMessage,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (error) {
      const friendlyMessage =
        error?.message || "AI service unavailable.";

      setChatError(friendlyMessage);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: friendlyMessage,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleSend();
  };

  const handleResetSession = () => {
    setClaimSession(null);
    setPolicyFile(null);
    setEstimateFile(null);
    setPolicyError("");
    setEstimateError("");
    setUploadError("");
    setUploadSuccess("");
    setChatError("");
    setInput("");
    setMessages(createStarterMessages(false));

    if (policyInputRef.current) {
      policyInputRef.current.value = "";
    }

    if (estimateInputRef.current) {
      estimateInputRef.current.value = "";
    }
  };

  const uploadButtonLabel = claimReady ? "Update Documents" : "Process Documents";

  const policyFileLabel = policyFile
    ? `${policyFile.name} · ${formatFileSize(policyFile.size)}`
    : claimSession?.policyFileName || "No PDF selected yet";

  const estimateFileLabel = estimateFile
    ? `${estimateFile.name} · ${formatFileSize(estimateFile.size)}`
    : claimSession?.estimateFileName || "No PDF selected yet";

  return (
    <div className="app-shell">
      <main className={`layout${isChatExpanded ? " chat-expanded" : ""}`}>
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">MEDIBRIDGE AI</p>

            <h1>
              Upload PDFs,
              <br />
              extract coverage,
              <br />
              ask instantly.
            </h1>

            <p className="hero-text">
              Process an insurance policy PDF and a hospital estimate PDF,
              store the extracted text in a claim session, then ask questions
              about coverage, exclusions, waiting periods, and out-of-pocket costs.
            </p>
          </div>

          <div className="claim-panel">
            <div className="claim-panel-header">
              <div>
                <p className="panel-label">DOCUMENT UPLOAD</p>
                <h2>Prepare your claim session</h2>
              </div>

              <span className={`status-pill ${claimReady ? "ready" : "busy"}`}>
                {claimReady ? "Claim ready" : "Awaiting PDFs"}
              </span>
            </div>

            <div className="claim-grid">
              <div className="info-card upload-card">
                <span>Insurance Policy PDF</span>
                <strong>{policyFileLabel}</strong>
                <p>
                  Upload the policy PDF that describes your coverage, exclusions,
                  and limits.
                </p>
                <div className="upload-card-actions">
                  <button
                    type="button"
                    onClick={() => policyInputRef.current?.click()}
                  >
                    {policyFile ? "Replace PDF" : "Choose PDF"}
                  </button>
                </div>
                <input
                  ref={policyInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePolicySelect}
                />
                {policyError && <p className="error-text">{policyError}</p>}
              </div>

              <div className="info-card upload-card">
                <span>Hospital Estimate PDF</span>
                <strong>{estimateFileLabel}</strong>
                <p>
                  Upload the estimate PDF so MediBridge can compare billing
                  items against the policy.
                </p>
                <div className="upload-card-actions">
                  <button
                    type="button"
                    onClick={() => estimateInputRef.current?.click()}
                  >
                    {estimateFile ? "Replace PDF" : "Choose PDF"}
                  </button>
                </div>
                <input
                  ref={estimateInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleEstimateSelect}
                />
                {estimateError && <p className="error-text">{estimateError}</p>}
              </div>

              <div className="info-card full-width highlight">
                <span>Claim Session</span>
                <strong>
                  {claimReady ? "Ready for chat" : "No claim created yet"}
                </strong>
                <p>
                  {claimReady
                    ? `Claim ID: ${claimId}`
                    : "Upload both PDFs to create a claim ID and unlock document-based chat."}
                </p>
                {claimReady && (
                  <div className="claim-session-meta">
                    <p>
                      Policy file: <strong>{claimSession?.policyFileName}</strong>
                    </p>
                    <p>
                      Estimate file: <strong>{claimSession?.estimateFileName}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="session-actions">
              <button
                type="button"
                className="process-button"
                onClick={handleProcessDocuments}
                disabled={isProcessing || !policyFile || !estimateFile}
              >
                {isProcessing ? "Processing your documents..." : uploadButtonLabel}
              </button>

              {claimReady && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleResetSession}
                >
                  Clear session
                </button>
              )}
            </div>

            {uploadSuccess && <p className="success-text">{uploadSuccess}</p>}
            {uploadError && <p className="error-text">{uploadError}</p>}
          </div>
        </section>

        <section className="chat-panel">
          <div className="chat-header">
            <div>
              <p className="panel-label">CHATBOT</p>
              <h2>Ask MediBridge AI</h2>
            </div>

            <div className="chat-header-actions">
              <span className={`status-pill ${claimReady ? "ready" : "busy"}`}>
                {claimReady ? "Ready" : "Upload required"}
              </span>

              <button
                type="button"
                className="chat-expand-button"
                onClick={() => setIsChatExpanded((current) => !current)}
                aria-label={isChatExpanded ? "Collapse chat" : "Expand chat"}
                title={isChatExpanded ? "Collapse chat" : "Expand chat"}
              >
                <span aria-hidden="true">{isChatExpanded ? "⤡" : "⤢"}</span>
              </button>
            </div>
          </div>

          <div className="message-stream">
            {messages.map((message, index) => (
              <article key={index} className={`message ${message.role}`}>
                <span className="message-role">
                  {message.role === "assistant" ? "MEDIBRIDGE" : "YOU"}
                </span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <div className="prompt-row">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                className="prompt-chip"
                type="button"
                disabled={!claimReady || isSending}
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                claimReady
                  ? "Type your question here..."
                  : "Upload both PDFs first to enable document-specific chat..."
              }
              rows={3}
              disabled={!claimReady}
            />

            <div className="composer-footer">
              <p className="helper-text">
                {claimReady
                  ? "I can explain insurance and billing, but I can't provide medical advice."
                  : "Process your PDFs first so the chatbot can use the claim ID and extracted text."}
              </p>

              <button type="submit" disabled={isSending || !claimReady || !input.trim()}>
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>

            {chatError && <p className="error-text">{chatError}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}

export default Upload;
