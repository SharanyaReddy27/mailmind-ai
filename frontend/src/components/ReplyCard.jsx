function ReplyCard({ reply, copied, onCopy }) {
  if (!reply) {
    return null;
  }

  return (
    <div className="result-card reply-card">
      <div className="result-card-header">
        <span className="result-icon">✉</span>
        <h4>Suggested Reply</h4>
      </div>
      <textarea readOnly value={reply} />
      <button type="button" className="copy-button" onClick={onCopy}>
        {copied ? "Copied!" : "Copy Reply"}
      </button>
    </div>
  );
}

export default ReplyCard;
