function SummaryCard({ title, content }) {
  if (!content) {
    return null;
  }

  return (
    <div className="result-card summary-card">
      <div className="result-card-header">
        <span className="result-icon">✦</span>
        <h4>{title}</h4>
      </div>
      <p>{content}</p>
    </div>
  );
}

export default SummaryCard;
