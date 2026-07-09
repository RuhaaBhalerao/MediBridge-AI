import { useEffect, useRef, useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar.jsx";
import DocumentCard from "../components/DocumentCard.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import {
  ClaimMetricCard,
  CostBreakdownChart,
  CoverageClarityCard,
  CoverageFlagsCard,
  ClaimReadinessCard,
  NextActionCard,
  formatCurrency,
} from "../components/OverviewCards.jsx";
import { retryClaimAnalysis, sendChatMessage, uploadClaimDocuments } from "../services/api.jsx";

const CLAIM_SESSION_KEY = "medibridgeClaimSession";
const DOCUMENTS_READY_MESSAGE = "Documents processed successfully. Ask me anything about your coverage.";

const isPdfFile = (file) => {
  if (!file) {
    return false;
  }

  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
};

const formatFileSize = (sizeInBytes) => {
  if (sizeInBytes === null || sizeInBytes === undefined) {
    return "";
  }

  const sizeInMb = sizeInBytes / (1024 * 1024);

  if (sizeInMb < 1) {
    const sizeInKb = sizeInBytes / 1024;
    return `${Math.round(sizeInKb)} KB`;
  }

  return `${sizeInMb.toFixed(1)} MB`;
};

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

const buildFollowUpQuestion = (title) => {
  const trimmedTitle = (title || "").replace(/[.?!]+$/, "").trim();

  if (!trimmedTitle) {
    return "Can you explain the next step for my claim?";
  }

  return `Can you explain why I should ${trimmedTitle.charAt(0).toLowerCase()}${trimmedTitle.slice(1)}?`;
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
  const [uploadStatus, setUploadStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const policyInputRef = useRef(null);
  const estimateInputRef = useRef(null);
  const chatInputRef = useRef(null);

  const claimId = claimSession?.claimId || "";
  const claimReady = Boolean(claimId);
  const analysis = claimSession?.analysis || null;
  const analysisStatus = claimSession?.analysisStatus || (claimSession?.analysis ? "complete" : "idle");
  const isAnalysisLoading = isProcessing || analysisStatus === "pending";
  const isAnalysisError = analysisStatus === "failed";
  const hasAnalysis = analysisStatus === "complete" && Boolean(analysis);

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

  const syncClaimSession = (response, fallbackFiles = {}) => {
    setClaimSession((current) => ({
      claimId: response.claimId || current?.claimId || "",
      policyFileName: response.policyFileName || current?.policyFileName || fallbackFiles.policyFileName || "",
      estimateFileName:
        response.estimateFileName || current?.estimateFileName || fallbackFiles.estimateFileName || "",
      policyFileSize: current?.policyFileSize ?? fallbackFiles.policyFileSize ?? null,
      estimateFileSize: current?.estimateFileSize ?? fallbackFiles.estimateFileSize ?? null,
      analysis: response.analysis ?? null,
      analysisStatus: response.analysisStatus || (response.analysis ? "complete" : "failed"),
      analysisError: response.analysisError || "",
    }));
  };

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
    setUploadStatus("");
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
    setUploadStatus("");
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
    setUploadStatus("Analyzing your coverage...");

    try {
      const response = await uploadClaimDocuments({
        policyFile,
        estimateFile,
        claimId,
      });

      syncClaimSession(response, {
        policyFileName: policyFile.name,
        estimateFileName: estimateFile.name,
        policyFileSize: policyFile.size,
        estimateFileSize: estimateFile.size,
      });

      setUploadStatus(
        response.analysisStatus === "failed"
          ? "Documents processed. The dashboard needs another analysis run."
          : "Documents ready"
      );
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

  const handleRetryAnalysis = async () => {
    if (!claimId || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setUploadError("");
    setUploadStatus("Retrying analysis...");
    setClaimSession((current) =>
      current
        ? {
            ...current,
            analysis: null,
            analysisStatus: "pending",
            analysisError: "",
          }
        : current
    );

    try {
      const response = await retryClaimAnalysis(claimId);
      syncClaimSession(response);
      setUploadStatus("Documents ready");
    } catch (error) {
      const errorMessage = error?.message || "We couldn't generate the claim overview.";
      setClaimSession((current) =>
        current
          ? {
              ...current,
              analysis: null,
              analysisStatus: "failed",
              analysisError: errorMessage,
            }
          : current
      );
      setUploadError(errorMessage);
      setUploadStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskAboutThis = () => {
    const question = buildFollowUpQuestion(analysis?.nextAction?.title);
    setInput(question);
    setChatError("");
    window.requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
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

  const metricValues = [
    {
      label: "Total Estimate",
      value: formatCurrency(analysis?.costBreakdown?.totalEstimate),
      tone: "teal",
      icon: "₹",
    },
    {
      label: "Likely Covered",
      value: formatCurrency(analysis?.costBreakdown?.estimatedCoverage),
      tone: "green",
      icon: "✓",
    },
    {
      label: "Potential Patient Cost",
      value: formatCurrency(analysis?.costBreakdown?.estimatedPatientCost),
      tone: "amber",
      icon: "!",
    },
  ];

  return (
    <div className={`app-shell${isChatExpanded ? " is-chat-expanded" : ""}`}>
      <div className="dashboard-shell">
        <DashboardSidebar />

        <main className="workspace-grid">
          <section className="left-column">
            <section className="panel documents-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Documents</p>
                  <h2>Documents</h2>
                  <p className="section-subtitle">Upload the policy and estimate PDFs to generate the claim overview.</p>
                </div>

                <span className={`status-pill ${claimReady ? "ready" : "busy"}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {claimReady ? "Documents Ready" : "Upload required"}
                </span>
              </div>

              <div className="document-grid">
                <DocumentCard
                  label="Insurance Policy"
                  fileName={policyFile?.name || claimSession?.policyFileName || ""}
                  fileSize={
                    policyFile ? formatFileSize(policyFile.size) : formatFileSize(claimSession?.policyFileSize)
                  }
                  processed={Boolean(claimSession?.policyFileName)}
                  inputRef={policyInputRef}
                  onSelect={handlePolicySelect}
                  error={policyError}
                  onClick={() => policyInputRef.current?.click()}
                />

                <DocumentCard
                  label="Hospital Estimate"
                  fileName={estimateFile?.name || claimSession?.estimateFileName || ""}
                  fileSize={
                    estimateFile ? formatFileSize(estimateFile.size) : formatFileSize(claimSession?.estimateFileSize)
                  }
                  processed={Boolean(claimSession?.estimateFileName)}
                  inputRef={estimateInputRef}
                  onSelect={handleEstimateSelect}
                  error={estimateError}
                  onClick={() => estimateInputRef.current?.click()}
                />
              </div>

              <div className="upload-footer">
                <button
                  type="button"
                  className="primary-action"
                  onClick={handleProcessDocuments}
                  disabled={isProcessing || !policyFile || !estimateFile}
                >
                  {isProcessing ? "Analyzing your coverage..." : "Start Claim Session"}
                </button>

                {uploadStatus && (
                  <span className="compact-success" aria-live="polite">
                    <span aria-hidden="true">✓</span>
                    <span>{uploadStatus}</span>
                  </span>
                )}
              </div>

              <p className="subtle-note">Your documents are used to answer coverage questions.</p>
              {uploadError && <p className="field-error upload-error">{uploadError}</p>}
            </section>

            <div className="analysis-stack">
              {isAnalysisLoading ? (
                <section className="dashboard-card analysis-loading-card">
                  <div className="analysis-loading-inline">
                    <span className="loading-spinner" aria-hidden="true" />
                    <p>Analyzing your coverage...</p>
                    <span>Comparing your policy with the hospital estimate.</span>
                  </div>
                </section>
              ) : isAnalysisError ? (
                <section className="dashboard-card analysis-error-card">
                  <div className="dashboard-card-header">
                    <div>
                      <p className="eyebrow">Claim Overview</p>
                      <h2>We couldn't generate the claim overview.</h2>
                    </div>
                    <span className="status-chip warning">Analysis failed</span>
                  </div>
                  <p className="card-summary">You can still ask MediBridge questions about your documents.</p>
                  <button type="button" className="secondary-action" onClick={handleRetryAnalysis} disabled={isProcessing}>
                    {isProcessing ? "Retrying..." : "Retry analysis"}
                  </button>
                </section>
              ) : hasAnalysis ? (
                <>
                  <section className="dashboard-card overview-card">
                    <div className="dashboard-card-header">
                      <div>
                        <p className="eyebrow">Claim Overview</p>
                        <h2>Insurance Claim Overview</h2>
                      </div>
                    </div>
                    <div className="metric-grid">
                      {metricValues.map((metric) => (
                        <ClaimMetricCard key={metric.label} {...metric} />
                      ))}
                    </div>
                  </section>

                  <CostBreakdownChart analysis={analysis} />

                  <div className="insight-grid">
                    <CoverageClarityCard analysis={analysis} />
                    <CoverageFlagsCard flags={analysis?.coverageFlags || []} />
                    <ClaimReadinessCard analysis={analysis} />
                  </div>

                  <NextActionCard
                    analysis={analysis}
                    onAskAboutThis={handleAskAboutThis}
                    onRetry={handleRetryAnalysis}
                    isRetrying={isProcessing}
                    hasAnalysisError={false}
                  />
                </>
              ) : (
                <section className="dashboard-card analysis-empty-card">
                  <div className="dashboard-card-header">
                    <div>
                      <p className="eyebrow">Claim Overview</p>
                      <h2>Upload both PDFs to generate the dashboard.</h2>
                    </div>
                  </div>
                  <p className="card-summary">
                    MediBridge will compare the policy and estimate, then show the coverage summary here.
                  </p>
                </section>
              )}
            </div>
          </section>

          <ChatPanel
            claimReady={claimReady}
            isChatExpanded={isChatExpanded}
            onToggleExpand={() => setIsChatExpanded((current) => !current)}
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            chatError={chatError}
            isSending={isSending}
            inputRef={chatInputRef}
          />
        </main>
      </div>
    </div>
  );
}

export default Upload;
