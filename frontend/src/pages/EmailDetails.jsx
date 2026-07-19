import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEmailById, getErrorMessage } from "../services/api";

function EmailDetails() {
  const { id } = useParams();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getEmailById(id)
      .then((response) => {
        setEmail(response.data);
        setError("");
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p>Loading email...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!email) {
    return <p>Email not found.</p>;
  }

  return (
    <section className="email-details">
      <Link to="/inbox">← Back to Inbox</Link>

      <div className="email-details-header">
        <div>
          <h1>{email.subject}</h1>
          <p>
            From: {email.senderName} ({email.senderEmail})
          </p>
        </div>

        <span className={`priority ${email.priority.toLowerCase()}`}>
          {email.priority}
        </span>
      </div>

      <hr />

      <p className="email-body">{email.body}</p>

      <div className="email-actions">
        <button type="button" disabled>
          Summarize
        </button>

        <button type="button" disabled>
          Generate Reply
        </button>

        <button type="button" disabled>
          Extract Tasks
        </button>
      </div>
    </section>
  );
}

export default EmailDetails;