function EmailCard({ email }) {
  return (
    <div className="email-card">
      <div>
        <h3>{email.senderName}</h3>
        <p>{email.senderEmail}</p>
      </div>

      <h4>{email.subject}</h4>
      <p>{email.snippet}</p>

      <div className="email-info">
        <span>Priority: {email.priority}</span>
        <span>{email.unread ? "Unread" : "Read"}</span>
      </div>
    </div>
  );
}

export default EmailCard;