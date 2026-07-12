import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  retryClaimAnalysis,
  sendChatMessage,
  uploadClaimDocuments,
  fetchChatSessions,
  fetchChatHistory,
} from "../services/api.jsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLAIM_SESSION_KEY = "medibridgeClaimSession";
const DOCUMENTS_READY_MESSAGE =
  "Documents processed successfully. Ask me anything about your coverage.";

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const isPdfFile = (file) => {
  if (!file) return false;
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
};

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return "";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
};

const getStoredClaimSession = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLAIM_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.claimId ? parsed : null;
  } catch {
    return null;
  }
};

const createInitialMessages = (hasClaim) =>
  hasClaim ? [{ role: "system", content: DOCUMENTS_READY_MESSAGE }] : [];

const buildFollowUpQuestion = (title) => {
  const t = (title || "").replace(/[.?!]+$/, "").trim();
  if (!t) return "Can you explain the next step for my claim?";
  return `Can you explain why I should ${t.charAt(0).toLowerCase()}${t.slice(1)}?`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Upload() {
  const initialClaimSession = getStoredClaimSession();

  // ---- claim session (active) ----
  const [claimSession, setClaimSession] = useState(initialClaimSession);

  // ---- sidebar session list (from DB) ----
  const [sessions, setSessions] = useState([]);

  // ---- chat ----
  const [messages, setMessages] = useState(() =>
    createInitialMessages(Boolean(initialClaimSession?.claimId))
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // ---- upload ----
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

  // Derived
  const claimId = claimSession?.claimId || "";
  const claimReady = Boolean(claimId);
  const analysis = claimSession?.analysis || null;
  const analysisStatus =
    claimSession?.analysisStatus || (claimSession?.analysis ? "complete" : "idle");
  const isAnalysisLoading = isProcessing || analysisStatus === "pending";
  const isAnalysisError = analysisStatus === "failed";
  const hasAnalysis = analysisStatus === "complete" && Boolean(analysis);

  // ---------------------------------------------------------------------------
  // Persist active session to localStorage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (claimSession?.claimId) {
      window.localStorage.setItem(CLAIM_SESSION_KEY, JSON.stringify(claimSession));
    } else {
      window.localStorage.removeItem(CLAIM_SESSION_KEY);
    }
  }, [claimSession]);

  // ---------------------------------------------------------------------------
  // Escape closes expanded chat
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isChatExpanded) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setIsChatExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isChatExpanded]);

  // ---------------------------------------------------------------------------
  // Load all sessions for the sidebar
  // ---------------------------------------------------------------------------
  const loadSessions = useCallback(async () => {
    const data = await fetchChatSessions();
    setSessions(data);
  }, []);

  // ---------------------------------------------------------------------------
  // Restore message history for a given claimId
  // ---------------------------------------------------------------------------
  const loadHistoryForClaim = useCallback(async (targetClaimId) => {
    if (!targetClaimId) return;
    const { messages: stored } = await fetchChatHistory(targetClaimId);
    if (Array.isArray(stored) && stored.length > 0) {
      setMessages(stored);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // On mount: load sidebar sessions + restore history for the active claim
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadSessions();
    if (initialClaimSession?.claimId) {
      loadHistoryForClaim(initialClaimSession.claimId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Start a new chat session
  // ---------------------------------------------------------------------------
  const handleNewChat = useCallback(() => {
    // Clear the active claim session
    setClaimSession(null);
    setPolicyFile(null);
    setEstimateFile(null);
    setPolicyError("");
    setEstimateError("");
    setUploadError("");
    setUploadStatus("");
    setChatError("");
    setInput("");
    setMessages([]);
  }, []);

  // ---------------------------------------------------------------------------
  // Switch to a past session from the sidebar
  // ---------------------------------------------------------------------------
  const handleSelectSession = useCallback(async (session) => {
    const populatedClaim =
      typeof session.claimId === "object" ? session.claimId : null;
    const selectedClaimId = String(populatedClaim?._id ?? session.claimId ?? "");
    if (!selectedClaimId) return;

    // Restore analysis + filenames from the populated claim
    setClaimSession({
      claimId: selectedClaimId,
      policyFileName: populatedClaim?.policyFileName || "",
      estimateFileName: populatedClaim?.estimateFileName || "",
      policyFileSize: null,
      estimateFileSize: null,
      analysis: populatedClaim?.analysis ?? null,
      analysisStatus:
        populatedClaim?.analysisStatus ||
        (populatedClaim?.analysis ? "complete" : "idle"),
      analysisError: "",
    });

    // Clear upload state — user is viewing a past session
    setPolicyFile(null);
    setEstimateFile(null);
    setPolicyError("");
    setEstimateError("");
    setUploadError("");
    setUploadStatus("");
    setChatError("");
    setInput("");

    // Seed with system message then replace with DB history
    setMessages([{ role: "system", content: DOCUMENTS_READY_MESSAGE }]);
    const { messages: stored } = await fetchChatHistory(selectedClaimId);
    if (Array.isArray(stored) && stored.length > 0) {
      setMessages(stored);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Sync helper — called after upload or retry
  // ---------------------------------------------------------------------------
  const syncClaimSession = (response, fallbackFiles = {}) => {
    setClaimSession((cur) => ({
      claimId: response.claimId || cur?.claimId || "",
      policyFileName:
        response.policyFileName || cur?.policyFileName || fallbackFiles.policyFileName || "",
      estimateFileName:
        response.estimateFileName ||
        cur?.estimateFileName ||
        fallbackFiles.estimateFileName ||
        "",
      policyFileSize: cur?.policyFileSize ?? fallbackFiles.policyFileSize ?? null,
      estimateFileSize: cur?.estimateFileSize ?? fallbackFiles.estimateFileSize ?? null,
      analysis: response.analysis ?? null,
      analysisStatus: response.analysisStatus || (response.analysis ? "complete" : "failed"),
      analysisError: response.analysisError || "",
    }));
  };

  // ---------------------------------------------------------------------------
  // File selection handlers
  // ---------------------------------------------------------------------------
  const handlePolicySelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
    if (!file) return;
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

  // ---------------------------------------------------------------------------
  // Process (upload) documents
  // ---------------------------------------------------------------------------
  const handleProcessDocuments = async () => {
    if (isProcessing) return;

    let hasError = false;
    if (!policyFile) { setPolicyError("Insurance policy PDF is required."); hasError = true; }
    if (!estimateFile) { setEstimateError("Hospital estimate PDF is required."); hasError = true; }
    if (hasError) return;

    setIsProcessing(true);
    setUploadError("");
    setUploadStatus("Analyzing your coverage...");

    try {
      const response = await uploadClaimDocuments({ policyFile, estimateFile, claimId });

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

      // Seed system message (keep any prior user/assistant turns)
      setMessages((cur) => [
        { role: "system", content: DOCUMENTS_READY_MESSAGE },
        ...cur.filter((m) => m.role !== "system"),
      ]);

      // Refresh sidebar so the new session appears immediately
      await loadSessions();
    } catch (error) {
      setUploadError(error?.message || "We could not process your documents right now.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Retry analysis
  // ---------------------------------------------------------------------------
  const handleRetryAnalysis = async () => {
    if (!claimId || isProcessing) return;

    setIsProcessing(true);
    setUploadError("");
    setUploadStatus("Retrying analysis...");
    setClaimSession((cur) =>
      cur ? { ...cur, analysis: null, analysisStatus: "pending", analysisError: "" } : cur
    );

    try {
      const response = await retryClaimAnalysis(claimId);
      syncClaimSession(response);
      setUploadStatus("Documents ready");
    } catch (error) {
      const msg = error?.message || "We couldn't generate the claim overview.";
      setClaimSession((cur) =>
        cur ? { ...cur, analysis: null, analysisStatus: "failed", analysisError: msg } : cur
      );
      setUploadError(msg);
      setUploadStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // "Ask about this" from NextActionCard
  // ---------------------------------------------------------------------------
  const handleAskAboutThis = () => {
    const question = buildFollowUpQuestion(analysis?.nextAction?.title);
    setInput(question);
    setChatError("");
    window.requestAnimationFrame(() => chatInputRef.current?.focus());
  };

  // ---------------------------------------------------------------------------
  // Send a chat message — DB persistence is handled server-side
  // ---------------------------------------------------------------------------
  const handleSend = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || isSending) return;

    if (!claimReady) {
      setChatError("Upload and process both PDFs before asking document-specific questions.");
      return;
    }

    setInput("");
    setChatError("");
    setMessages((cur) => [...cur, { role: "user", content: trimmed }]);
    setIsSending(true);

    try {
      const response = await sendChatMessage({ claimId, message: trimmed });
      setMessages((cur) => [...cur, { role: "assistant", content: response.reply }]);

      // Keep sidebar ordering fresh after a new message
      loadSessions();
    } catch (error) {
      const msg = error?.message || "AI service unavailable.";
      setChatError(msg);
      setMessages((cur) => [...cur, { role: "assistant", content: msg }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleSend();
  };

  // ---------------------------------------------------------------------------
  // Metric values (derived from analysis)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={`app-shell${isChatExpanded ? " is-chat-expanded" : ""}`}>
      <div className="dashboard-shell">

        {/* Sidebar — receives session list + active claim for highlighting */}
        <DashboardSidebar
          sessions={sessions}
          activeClaimId={claimId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />

        <main className="workspace-grid">
          {/* ----------------------------------------------------------------
              LEFT COLUMN — Documents + Analysis
          ---------------------------------------------------------------- */}
          <section className="left-column">

            {/* Documents panel */}
            <section className="panel documents-panel">
              <div className="panel-header">
                <div>
                  <h2>Documents</h2>
                  <p className="section-subtitle">
                    Upload the policy and estimate PDFs to generate the claim overview.
                  </p>
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
                    policyFile
                      ? formatFileSize(policyFile.size)
                      : formatFileSize(claimSession?.policyFileSize)
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
                    estimateFile
                      ? formatFileSize(estimateFile.size)
                      : formatFileSize(claimSession?.estimateFileSize)
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

            {/* Analysis stack */}
            <div className="analysis-stack">
              <div className="analysis-section-header">
                <h2 className="analysis-title">Claim Overview</h2>
                <p className="analysis-subtitle">
                  Your insurance claim overview based on the uploaded documents.
                </p>
              </div>

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
                    <h3 className="card-title">We couldn&apos;t generate the claim overview.</h3>
                    <span className="status-chip warning">Analysis failed</span>
                  </div>
                  <p className="card-summary">
                    You can still ask MediBridge questions about your documents.
                  </p>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={handleRetryAnalysis}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Retrying..." : "Retry analysis"}
                  </button>
                </section>

              ) : hasAnalysis ? (
                <>
                  <section className="dashboard-card overview-card">
                    <div className="metric-grid">
                      {metricValues.map((metric) => (
                        <ClaimMetricCard key={metric.label} {...metric} />
                      ))}
                    </div>
                  </section>

                  <div className="analysis-row-chart">
                    <CostBreakdownChart analysis={analysis} />
                    <CoverageClarityCard analysis={analysis} />
                  </div>

                  <div className="analysis-row-flags">
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
                    <h3 className="card-title">Upload both PDFs to generate the dashboard.</h3>
                  </div>
                  <p className="card-summary">
                    MediBridge will compare the policy and estimate, then show the coverage summary here.
                  </p>
                </section>
              )}
            </div>
          </section>

          {/* ----------------------------------------------------------------
              RIGHT COLUMN — Chat panel (unchanged)
          ---------------------------------------------------------------- */}
          <ChatPanel
            claimReady={claimReady}
            isChatExpanded={isChatExpanded}
            onToggleExpand={() => setIsChatExpanded((cur) => !cur)}
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
