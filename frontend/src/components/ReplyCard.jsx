import { Copy, RotateCcw, X } from "lucide-react";

function ReplyCard({
  reply,
  onChangeReply,
  onCopy,
  onRegenerate,
  onClear,
  copied,
  regenerating,
}) {
  if (!reply) {
    return null;
  }

  return (
    <div className="result-card reply-card signal-card">
      <div className="result-card-header">
        <span className="result-icon">✉</span>
        <h4>AI Reply</h4>
      </div>

      <label htmlFor="generated-reply" className="reply-label">
        Edit your reply before sending
      </label>

      <textarea
        id="generated-reply"
        value={reply}
        onChange={(e) => onChangeReply(e.target.value)}
        disabled={regenerating}
        aria-label="Generated email reply"
      />

      <div className="reply-toolbar">
        <button type="button" className="copy-button" onClick={onCopy}>
          <Copy size={14} strokeWidth={2.25} />
          Copy
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onRegenerate}
          disabled={regenerating}
        >
          <RotateCcw size={14} strokeWidth={2.25} />
          {regenerating ? "Regenerating..." : "Regenerate"}
        </button>

        <button
          type="button"
          className="text-button"
          onClick={onClear}
          disabled={regenerating}
        >
          <X size={14} strokeWidth={2.25} />
          Clear
        </button>
      </div>

      {copied && (
        <p className="copy-success" role="status">
          ✓ Copied to clipboard
        </p>
      )}
    </div>
  );
}

export default ReplyCard;
