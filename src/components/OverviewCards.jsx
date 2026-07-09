import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not determined";
  }

  return `₹${currencyFormatter.format(Number(value))}`;
};

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not determined";
  }

  return `${value}%`;
};

const renderChartLabel = ({ x, y, width, value }) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const textX = x + width / 2;

  return (
    <text x={textX} y={y - 8} fill="#415343" textAnchor="middle" fontSize="12" fontWeight="600">
      {formatCurrency(value)}
    </text>
  );
};

const SectionCard = ({ eyebrow, title, action, children, className = "" }) => (
  <section className={`dashboard-card ${className}`.trim()}>
    <div className="dashboard-card-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const ClaimMetricCard = ({ label, value, tone = "teal", icon }) => (
  <article className={`metric-card tone-${tone}`}>
    <span className="metric-icon" aria-hidden="true">
      {icon}
    </span>
    <div className="metric-copy">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </article>
);

export const CostBreakdownChart = ({ analysis, isLoading = false }) => {
  const costBreakdown = analysis?.costBreakdown || {};
  const data = [
    {
      label: "Total Estimate",
      value: costBreakdown.totalEstimate,
      fill: "#7ebf70",
    },
    {
      label: "Likely Covered",
      value: costBreakdown.estimatedCoverage,
      fill: "#4cae74",
    },
    {
      label: "Potential Patient Cost",
      value: costBreakdown.estimatedPatientCost,
      fill: "#e7a73a",
    },
  ];

  const hasAnyValue = data.some((item) => item.value !== null && item.value !== undefined);

  return (
    <SectionCard eyebrow="Claim Overview" title="Estimated Cost Breakdown" className="chart-card">
      {isLoading ? (
        <div className="analysis-loading-inline">
          <span className="loading-spinner" aria-hidden="true" />
          <p>Analyzing your coverage...</p>
          <span>Comparing your policy with the hospital estimate.</span>
        </div>
      ) : hasAnyValue ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(47, 73, 53, 0.08)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} />
              <YAxis tickFormatter={(value) => `₹${currencyFormatter.format(value)}`} tickLine={false} axisLine={false} width={70} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => label}
                cursor={{ fill: "rgba(126, 191, 112, 0.08)" }}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.label}`} fill={entry.value === null || entry.value === undefined ? "rgba(47, 73, 53, 0.14)" : entry.fill} />
                ))}
                <LabelList content={renderChartLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="section-footnote">Estimates based on the uploaded documents and AI analysis.</p>
        </div>
      ) : (
        <div className="empty-panel compact">
          <p>Upload both PDFs to generate the cost breakdown.</p>
        </div>
      )}
    </SectionCard>
  );
};

export const CoverageClarityCard = ({ analysis }) => {
  const score = analysis?.coverageClarity?.score ?? null;
  const reason = analysis?.coverageClarity?.reason || "Coverage clarity could not be determined.";
  const status = analysis?.coverageClarity?.status || "unclear";
  const progress = score === null ? 0 : Math.max(0, Math.min(100, score));

  return (
    <SectionCard eyebrow="Coverage" title="Coverage Clarity" className="insight-card">
      <div className="card-title-row">
        <span className="info-icon" aria-hidden="true">
          i
        </span>
        <strong>{score === null ? "Coverage clarity could not be determined." : `${progress}%`}</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill clarity" style={{ width: `${progress}%` }} />
      </div>
      <p className="card-summary">{reason}</p>
      <span className="status-chip subtle">{status}</span>
    </SectionCard>
  );
};

export const CoverageFlagsCard = ({ flags = [] }) => {
  const visibleFlags = flags.slice(0, 3);
  const hasMore = flags.length > visibleFlags.length;

  return (
    <SectionCard eyebrow="Coverage" title="Coverage Flags" className="insight-card">
      <div className="flag-list">
        {visibleFlags.length > 0 ? (
          visibleFlags.map((flag, index) => (
            <article key={`${flag.title}-${index}`} className={`flag-item type-${flag.type || "warning"}`}>
              <span className="flag-icon" aria-hidden="true">
                {flag.type === "positive" ? "✓" : flag.type === "risk" ? "!" : "⚠"}
              </span>
              <div>
                <strong>{flag.title}</strong>
                <p>{flag.reason}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="card-summary">No clear coverage flags were identified from the uploaded documents.</p>
        )}
      </div>
      {hasMore && <button type="button" className="text-button">View all</button>}
    </SectionCard>
  );
};

export const ClaimReadinessCard = ({ analysis }) => {
  const checks = analysis?.claimReadiness?.checks || [];
  const score = analysis?.claimReadiness?.score ?? null;
  const completedChecks = checks.filter((check) => check.status === "complete").length;
  const progress = score === null ? 0 : Math.max(0, Math.min(100, score));
  const scoreText = score === null ? "Not determined" : `${progress}%`;
  const completionText = checks.length > 0 ? `${completedChecks} of ${checks.length} checks complete` : "No readiness checks available";

  return (
    <SectionCard eyebrow="Claim" title="Claim Readiness" className="insight-card">
      <div className="claim-readiness-header">
        <strong>{completionText}</strong>
        <span>{scoreText}</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill readiness" style={{ width: `${progress}%` }} />
      </div>
      <div className="readiness-list">
        {checks.length > 0 ? (
          checks.map((check, index) => (
            <div key={`${check.label}-${index}`} className="readiness-item">
              <span className={`readiness-mark ${check.status}`} aria-hidden="true">
                {check.status === "complete" ? "✓" : check.status === "missing" ? "–" : "!"}
              </span>
              <span>{check.label}</span>
            </div>
          ))
        ) : (
          <p className="card-summary">No readiness checks returned by the analysis yet.</p>
        )}
      </div>
    </SectionCard>
  );
};

export const NextActionCard = ({ analysis, onAskAboutThis, onRetry, isRetrying = false, hasAnalysisError = false }) => {
  const title = analysis?.nextAction?.title || "We couldn't generate the claim overview.";
  const reason = analysis?.nextAction?.reason || "You can still ask MediBridge questions about your documents.";

  return (
    <section className={`dashboard-card next-action-card${hasAnalysisError ? " error" : ""}`}>
      <div className="dashboard-card-header">
        <div>
          <p className="eyebrow">Recommended Next Step</p>
          <h2>Recommended Next Step</h2>
        </div>
        {hasAnalysisError && <span className="status-chip warning">Analysis unavailable</span>}
      </div>
      <div className="next-action-copy">
        <strong>{title}</strong>
        <p>{reason}</p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action compact" onClick={onAskAboutThis}>
          Ask MediBridge about this
        </button>
        {hasAnalysisError && (
          <button type="button" className="secondary-action" onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? "Retrying..." : "Retry analysis"}
          </button>
        )}
      </div>
    </section>
  );
};

export { formatCurrency, formatScore };
