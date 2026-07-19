import { Link } from "react-router-dom";

function EmailCard({ email }) {
  return (
    <Link
      to={`/emails/${email._id}`}
      className="email-card-link"
    >
      <article className={`email-card ${email.unread ? "unread" : ""}`}>
        <div className="email-header">
          <div>
            <h3>{email.senderName}</h3>
            <p>{email.senderEmail}</p>
          </div>

          <span className={`priority ${email.priority.toLowerCase()}`}>
            {email.priority}
          </span>
        </div>

        <h4>{email.subject}</h4>
        <p>{email.snippet}</p>

        <span>{email.unread ? "Unread" : "Read"}</span>
      </article>
    </Link>
  );
}

export default EmailCard;