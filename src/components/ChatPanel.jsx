import { useEffect, useRef } from "react";

function ChatPanel({
  claimReady,
  isChatExpanded,
  onToggleExpand,
  messages,
  input,
  onInputChange,
  onSubmit,
  chatError,
  isSending,
  inputRef,
}) {
  const messagesEndRef = useRef(null);
  const documentsStatusLabel = claimReady ? "Documents Ready" : "Upload Required";

  // Scroll the message container to the newest message whenever messages change.
  // We scroll the sentinel element into view — this scrolls only inside
  // .message-stream, never the browser page.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <section className="panel chat-panel">
      {/* Header — fixed height, never scrolls */}
      <div className="chat-header">
        <div>
          <h2>Ask MediBridge AI</h2>
          <p className="section-subtitle">Ask any question about your coverage, costs, and claims.</p>
        </div>

        <div className="chat-header-actions">
          <span className={`status-pill ${claimReady ? "ready" : "busy"}`}>
            <span className="status-dot" aria-hidden="true" />
            {documentsStatusLabel}
          </span>

          <button
            type="button"
            className="chat-expand-button"
            onClick={onToggleExpand}
            aria-label={isChatExpanded ? "Collapse chat" : "Expand chat"}
            title={isChatExpanded ? "Collapse chat" : "Expand chat"}
          >
            <span aria-hidden="true">{isChatExpanded ? "↙" : "↗"}</span>
          </button>
        </div>
      </div>

      {/* Body — flex:1, owns remaining height */}
      <div className="chat-body">
        {/* Message stream — the ONLY scrollable part */}
        <div className="message-stream" role="log" aria-live="polite" aria-label="Conversation">
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
                  {message.role === "assistant" ? "MEDIBRIDGE" : message.role === "user" ? "YOU" : "SYSTEM"}
                </span>
                <p>{message.content}</p>
              </article>
            ))
          )}
          {/* Sentinel — scrolled into view when new messages arrive */}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Composer — pinned at bottom, never scrolls */}
        <form className="composer" onSubmit={onSubmit}>
          <div className="composer-shell">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Ask about your coverage..."
              rows={1}
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

        {/* Disclaimer — pinned below composer */}
        <p className="chat-disclaimer">AI-generated guidance. Verify important decisions with your insurer.</p>
      </div>
    </section>
  );
}

export default ChatPanel;
