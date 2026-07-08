import { useEffect, useRef, useState } from "react";
import { sendChatMessage, uploadClaimDocuments } from "../services/api.jsx";

const CLAIM_SESSION_KEY = "medibridgeClaimSession";
const DOCUMENTS_READY_MESSAGE = "Documents processed. Ask me anything about your coverage.";

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

const createInitialMessages = (hasClaim) =>
  hasClaim
    ? [
        {
          role: "system",
          content: DOCUMENTS_READY_MESSAGE,
        },
      ]
    : [];

const isPdfFile = (file) => {
  if (!file) {
    return false;
  }

  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
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
    createInitialMessages(Boolean(initialClaimSession?.claimId))
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
      window.localStorage.setItem(CLAIM_SESSION_KEY, JSON.stringify(claimSession));
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
      setUploadSuccess("Documents ready");
      setMessages((currentMessages) => {
        const nonSystemMessages = currentMessages.filter((message) => message.role !== "system");

        return [
          {
            role: "system",
            content: DOCUMENTS_READY_MESSAGE,
          },
          ...nonSystemMessages,
        ];
      });
    } catch (error) {
      setUploadError(error?.message || "We could not process your documents right now.");
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
      const friendlyMessage = error?.message || "AI service unavailable.";

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

  const renderDocumentCard = ({
    key,
    label,
    inputRef,
    file,
    storedFileName,
    onSelect,
    error,
    icon,
  }) => {
    const hasFile = Boolean(file || storedFileName);
    const fileName = file?.name || storedFileName || "";
    const fileSize = file ? formatFileSize(file.size) : "";

    return (
      <article className="document-card" key={key}>
        <div className="document-card-top">
          <span className="document-icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h3>{label}</h3>
          </div>
        </div>

        <button
          type="button"
          className={`document-dropzone${hasFile ? " is-ready" : ""}`}
          onClick={() => inputRef.current?.click()}
          aria-label={`Upload ${label}`}
        >
          {hasFile ? (
            <span className="selected-file">
              <span className="selected-file-main">{fileName}</span>
              <span className="selected-file-meta">
                {fileSize || "Processed"}
                <span className="check-mark" aria-hidden="true">
                  ✓
                </span>
              </span>
            </span>
          ) : (
            <span className="dropzone-copy">Drag &amp; drop or click to upload</span>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={onSelect}
          aria-label={label}
        />

        {error && <p className="field-error">{error}</p>}
      </article>
    );
  };

  return (
    <div className={`app-shell${isChatExpanded ? " is-chat-expanded" : ""}`}>
      <div className="dashboard-shell">
        <aside className="sidebar-panel">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <div>
              <strong>MediBridge AI</strong>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Primary">
            <button type="button" className="nav-item active">
              <span className="nav-icon" aria-hidden="true">
                ⌂
              </span>
              <span>Home</span>
            </button>
          </nav>
        </aside>

        <main className="workspace-grid">
          <section className="panel upload-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Document Upload</p>
                <h2>Upload Documents</h2>
                <p className="section-subtitle">
                  Add your insurance policy and hospital estimate to get started.
                </p>
              </div>

              <span className={`status-pill ${claimReady ? "ready" : "busy"}`}>
                {claimReady ? "Ready" : "Waiting"}
              </span>
            </div>

            <div className="document-grid">
              {renderDocumentCard({
                key: "policy",
                label: "Insurance Policy",
                inputRef: policyInputRef,
                file: policyFile,
                storedFileName: claimSession?.policyFileName,
                onSelect: handlePolicySelect,
                error: policyError,
                icon: "▣",
              })}

              {renderDocumentCard({
                key: "estimate",
                label: "Hospital Estimate",
                inputRef: estimateInputRef,
                file: estimateFile,
                storedFileName: claimSession?.estimateFileName,
                onSelect: handleEstimateSelect,
                error: estimateError,
                icon: "▣",
              })}
            </div>

            <div className="upload-footer">
              <button
                type="button"
                className="primary-action"
                onClick={handleProcessDocuments}
                disabled={isProcessing || !policyFile || !estimateFile}
              >
                {isProcessing ? "Processing..." : "Start Claim Session"}
              </button>

              {uploadSuccess && (
                <span className="compact-success" aria-live="polite">
                  <span aria-hidden="true">✓</span>
                  <span>{uploadSuccess}</span>
                </span>
              )}
            </div>

            <p className="subtle-note">Your documents are used to answer coverage questions.</p>
            {uploadError && <p className="field-error upload-error">{uploadError}</p>}
          </section>

          <section className="panel chat-panel">
            <div className="chat-header">
              <div>
                <p className="eyebrow">Chatbot</p>
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

            <div className="chat-body">
              <div className="message-stream">
                {!claimReady && messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <span className="chat-empty-icon" aria-hidden="true">
                      ✦
                    </span>
                    <p>Upload your documents to start asking questions.</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <article key={index} className={`message ${message.role}`}>
                      <span className="message-role">
                        {message.role === "assistant"
                          ? "MEDIBRIDGE"
                          : message.role === "user"
                            ? "YOU"
                            : "SYSTEM"}
                      </span>
                      <p>{message.content}</p>
                    </article>
                  ))
                )}
              </div>

              <form className="composer" onSubmit={handleSubmit}>
                <div className="composer-shell">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask about your coverage..."
                    rows={2}
                    disabled={!claimReady || isSending}
                  />

                  <button
                    type="submit"
                    className="send-button"
                    disabled={isSending || !claimReady || !input.trim()}
                    aria-label="Send message"
                  >
                    <span aria-hidden="true">➤</span>
                  </button>
                </div>

                {chatError && <p className="field-error chat-error">{chatError}</p>}
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Upload;
