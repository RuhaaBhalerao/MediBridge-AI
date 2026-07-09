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
  const documentsStatusLabel = claimReady ? "Documents Ready" : "Upload Required";

  return (
    <section className="panel chat-panel">
      <div className="chat-header">
        <div>
          <p className="eyebrow">Ask MediBridge AI</p>
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
                  {message.role === "assistant" ? "MEDIBRIDGE" : message.role === "user" ? "YOU" : "SYSTEM"}
                </span>
                <p>{message.content}</p>
              </article>
            ))
          )}
        </div>

        <form className="composer" onSubmit={onSubmit}>
          <div className="composer-shell">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Ask about your coverage..."
              rows={2}
              disabled={!claimReady || isSending}
            />

            <button type="submit" className="send-button" disabled={isSending || !claimReady || !input.trim()} aria-label="Send message">
              <span aria-hidden="true">➤</span>
            </button>
          </div>

          {chatError && <p className="field-error chat-error">{chatError}</p>}
        </form>
      </div>
    </section>
  );
}

export default ChatPanel;
