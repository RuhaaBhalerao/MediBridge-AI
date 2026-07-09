function DashboardSidebar() {
  return (
    <aside className="sidebar-panel" aria-label="Navigation">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <span />
        </span>
        <div>
          <strong className="brand-name">MediBridge AI</strong>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        <button type="button" className="nav-item active" aria-current="page">
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M4 11.5L12 4l8 7.5" />
              <path d="M6.5 10.5V20h11V10.5" />
            </svg>
          </span>
          <span>Home</span>
        </button>
      </nav>

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

export default DashboardSidebar;
