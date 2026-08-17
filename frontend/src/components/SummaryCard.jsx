import { Copy, RotateCcw, Sparkles } from "lucide-react";

function SummaryCard({ title, content, onCopy, onRegenerate, copied, regenerating }) {
  if (!content) {
    return null;
  }

  const bullets = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="result-card summary-card signal-card">
      <div className="result-card-header">
        <span className="result-icon">
          <Sparkles size={14} strokeWidth={2.25} />
        </span>
        <h4>{title}</h4>
      </div>

      {bullets.length > 1 ? (
        <ul className="summary-bullet-list">
          {bullets.map((line, index) => (
            <li key={index}>{line.replace(/^[•\-*]\s*/, "")}</li>
          ))}
        </ul>
      ) : (
        <p className="signal-card-body">{content}</p>
      )}

      {(onCopy || onRegenerate) && (
        <div className="reply-toolbar">
          {onCopy && (
            <button type="button" className="copy-button" onClick={onCopy}>
              <Copy size={14} strokeWidth={2.25} />
              Copy Summary
            </button>
          )}

          {onRegenerate && (
            <button
              type="button"
              className="secondary-button"
              onClick={onRegenerate}
              disabled={regenerating}
            >
              <RotateCcw size={14} strokeWidth={2.25} />
              {regenerating ? "Regenerating..." : "Regenerate"}
            </button>
          )}
        </div>
      )}

      {copied && (
        <p className="copy-success" role="status">
          ✓ Copied to clipboard
        </p>
      )}
    </div>
  );
}

export default SummaryCard;
