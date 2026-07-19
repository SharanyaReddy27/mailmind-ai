import { Link } from "react-router-dom";

function EmailCard({ email }) {
  const senderName = email.senderName || email.sender || "Unknown sender";
  const senderEmail = email.senderEmail || email.email || "";
  const preview =
    email.snippet || email.body || email.message || "No email content available.";
  const receivedAt = email.receivedAt || email.date || email.createdAt || "";
  const priority = (email.priority || "Medium").toLowerCase();
  const readStatus = email.unread || email.isRead === false ? "Unread" : "Read";

  const formatDate = (value) => {
    if (!value) {
      return "No date";
    }

    const dateValue = new Date(value);

    if (Number.isNaN(dateValue.getTime())) {
      return value;
    }

    return dateValue.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <article className={`email-card ${email.unread ? "unread" : ""}`}>
      <Link to={`/emails/${email._id}`} className="email-card-link">
        <div className="email-header">
          <div>
            <h3>{senderName}</h3>
            {senderEmail && <p>{senderEmail}</p>}
          </div>

          {email.priority && <span className={`priority ${priority}`}>{email.priority}</span>}
        </div>

        <h4>{email.subject}</h4>
        <p className="preview-text">{preview}</p>

        <div className="email-meta">
          <span>{formatDate(receivedAt)}</span>
          <span className={`status-pill ${readStatus.toLowerCase()}`}>{readStatus}</span>
          {email.source === "gmail" && <span className="gmail-pill">Gmail</span>}
        </div>
      </Link>
    </article>
  );
}

export default EmailCard;