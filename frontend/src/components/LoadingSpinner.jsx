function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function InboxSkeleton({ count = 6 }) {
  return (
    <div className="inbox-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="email-card skeleton-card" key={index}>
          <div className="email-header">
            <div className="skeleton-row">
              <span className="skeleton skeleton-avatar" />
              <span className="skeleton skeleton-line" style={{ width: "60%" }} />
            </div>
          </div>
          <span className="skeleton skeleton-line" style={{ width: "80%", height: 16 }} />
          <span className="skeleton skeleton-line" style={{ width: "95%" }} />
          <span className="skeleton skeleton-line" style={{ width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
