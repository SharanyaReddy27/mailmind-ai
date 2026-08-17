import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import Avatar from "./Avatar";

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function EmailCard({ email }) {
  const senderName = email.senderName || email.sender || "Unknown sender";
  const senderEmail = email.senderEmail || email.email || "";
  const preview =
    email.snippet || email.body || email.message || "No email content available.";
  const receivedAt = email.receivedAt || email.date || email.createdAt || "";
  const priority = (email.priority || "Medium").toLowerCase();
  const isUnread = email.unread || email.isRead === false;
  const readStatus = isUnread ? "Unread" : "Read";
  const readingTime = estimateReadingTime(email.body || email.snippet || "");

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
    <article className={`email-card priority-${priority} ${isUnread ? "unread" : ""}`}>
      <Link to={`/emails/${email._id}`} className="email-card-link">
        <div className="email-header">
          <div className="email-header-identity">
            <Avatar name={senderName} size={38} />
            <div>
              <h3>{senderName}</h3>
              {senderEmail && <p>{senderEmail}</p>}
            </div>
          </div>

          {email.priority && <span className={`priority priority--${priority}`}>{email.priority}</span>}
        </div>

        <h4>{email.subject}</h4>
        <p className="preview-text">{preview}</p>

        <div className="email-meta">
          <span className="email-meta-left">
            {isUnread && <span className="unread-dot" aria-hidden="true" />}
            {formatDate(receivedAt)}
            {readingTime && <span className="dot-separator">·</span>}
            {readingTime}
          </span>
          <div className="email-meta-right">
            {email.source === "gmail" && (
              <span className="gmail-pill">
                <Mail size={11} strokeWidth={2.5} />
                Gmail
              </span>
            )}
            <span className={`status-pill ${readStatus.toLowerCase()}`}>{readStatus}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default EmailCard;
