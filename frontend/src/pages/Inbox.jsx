import { useEffect, useState } from "react";
import api from "../services/api";
import EmailCard from "../components/EmailCard";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmails = () => {
    setLoading(true);
    api
      .get("/emails")
      .then((response) => {
        setEmails(response.data || []);
        setError("");
      })
      .catch(() => {
        setError("Unable to connect to backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEmails();
    const onSync = () => loadEmails();
    window.addEventListener('mailmind:sync', onSync);

    return () => window.removeEventListener('mailmind:sync', onSync);
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner label="Loading inbox..." />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>MailMind Inbox</h1>
          <p>Your latest messages in one place.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="refresh-button" onClick={loadEmails}>
            Refresh
          </button>
          <span className="pill">{emails.length} emails</span>
        </div>
      </div>

      {error && <ErrorMessage title="Connection issue" message={error} />}

      {!error && emails.length === 0 && (
        <div className="empty-state">No emails found.</div>
      )}

      <div className="inbox-grid">
        {emails.map((email) => (
          <EmailCard key={email._id || email.id} email={email} />
        ))}
      </div>
    </div>
  );
}

export default Inbox;