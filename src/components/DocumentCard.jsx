const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v6h6" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);

function DocumentCard({
  label,
  fileName,
  fileSize,
  processed = false,
  inputRef,
  onSelect,
  error,
  onClick,
}) {
  const hasFile = Boolean(fileName);

  return (
    <article className="document-card">
      <div className="document-card-top">
        <span className="document-icon" aria-hidden="true">
          <DocumentIcon />
        </span>
        <div className="document-card-copy">
          <h3>{label}</h3>
          <p>{processed ? "Processed" : hasFile ? "Selected" : "Waiting for upload"}</p>
        </div>
        {processed && (
          <span className="document-status-check" aria-label="Processed">
            ✓
          </span>
        )}
      </div>

      <button
        type="button"
        className="document-dropzone"
        onClick={onClick}
        aria-label={`Upload ${label}`}
      >
        {hasFile ? (
          <span className="selected-file">
            {/* title gives the full name on hover — truncation handled by CSS */}
            <span className="selected-file-main" title={fileName}>
              {fileName}
            </span>
            <span className="selected-file-meta">
              {fileSize || (processed ? "Processed" : "Ready to upload")}
            </span>
          </span>
        ) : (
          <span className="dropzone-copy">Click to choose a PDF</span>
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
}

export default DocumentCard;
