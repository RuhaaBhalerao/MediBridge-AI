function DashboardSidebar({ sessions = [], activeClaimId = "", onSelectSession, onNewChat }) {
  return (
    <aside className="sidebar-panel" aria-label="Navigation">
      {/* Brand */}
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <span />
        </span>
        <div>
          <strong className="brand-name">MediBridge AI</strong>
        </div>
      </div>

      {/* ---- Session list ---- */}
      {sessions.length > 0 && (
        <div className="session-list-wrap">
          <p className="session-list-label">Claim Sessions</p>
          <nav className="session-list" aria-label="Claim sessions">
            {sessions.map((session) => {
              const claimId =
                typeof session.claimId === "object"
                  ? session.claimId?._id
                  : session.claimId;

              const isActive = String(claimId) === String(activeClaimId);

              return (
                <button
                  key={session._id}
                  type="button"
                  className={`session-item${isActive ? " active" : ""}`}
                  onClick={() => onSelectSession?.(session)}
                  title={session.sessionName}
                  aria-current={isActive ? "true" : undefined}
                >
                  {/* Small file icon */}
                  <span className="session-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M7 3h7l5 5v13H7z" />
                      <path d="M14 3v6h6" />
                    </svg>
                  </span>

                  <span className="session-copy">
                    <span className="session-name">{session.sessionName}</span>
                    {session.lastMessageAt && (
                      <span className="session-meta">
                        {formatSessionDate(session.lastMessageAt)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* New Chat Button */}
      <button
        type="button"
        className="new-chat-button"
        onClick={onNewChat}
        title="Start a new claim session"
      >
        <span aria-hidden="true">+</span>
        <span>New Chat</span>
      </button>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="privacy-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.7-3 8.8-7 10-4-1.2-7-5.3-7-10V6l7-3z" />
            <path d="M12 8v6" />
            <path d="M12 16h.01" />
          </svg>
        </span>
        <p>Your data is private and secure</p>
      </div>
    </aside>
  );
}

// Short relative date: "Today", "Yesterday", or "DD MMM"
function formatSessionDate(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default DashboardSidebar;
