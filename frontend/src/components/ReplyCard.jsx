import { Copy, RotateCcw, SlidersHorizontal, X } from "lucide-react";

const TONE_LABELS = {
  professional: "Professional",
  friendly: "Friendly",
  concise: "Concise",
};

function ReplyCard({
  reply,
  tone,
  onChangeReply,
  onCopy,
  onRegenerate,
  onChangeTone,
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
        {tone && <span className="reply-tone-badge">{TONE_LABELS[tone] || tone}</span>}
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
          className="secondary-button"
          onClick={onChangeTone}
          disabled={regenerating}
        >
          <SlidersHorizontal size={14} strokeWidth={2.25} />
          Change Tone
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
