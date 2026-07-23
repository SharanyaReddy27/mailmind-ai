import { Sparkles } from "lucide-react";

function SummaryCard({ title, content }) {
  if (!content) {
    return null;
  }

  return (
    <div className="result-card summary-card signal-card">
      <div className="result-card-header">
        <span className="result-icon">
          <Sparkles size={14} strokeWidth={2.25} />
        </span>
        <h4>{title}</h4>
      </div>
      <p className="signal-card-body">{content}</p>
    </div>
  );
}

export default SummaryCard;
