import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import api from "../services/api";
import EmailCard from "../components/EmailCard";
import ErrorMessage from "../components/ErrorMessage";
import { InboxSkeleton } from "../components/LoadingSpinner";

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
        <div className="page-header">
          <div>
            <h1>MailMind Inbox</h1>
            <p>Your latest messages in one place.</p>
          </div>
        </div>
        <InboxSkeleton />
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
            <RefreshCw size={14} strokeWidth={2.25} />
            Refresh
          </button>
          <span className="pill">{emails.length} emails</span>
        </div>
      </div>

      {error && <ErrorMessage title="Connection issue" message={error} />}

      {!error && emails.length === 0 && (
        <div className="empty-state empty-state--panel">
          <p>No emails found.</p>
          <span>Connect Gmail from Settings or check back soon.</span>
        </div>
      )}

      <motion.div
        className="inbox-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.035 } },
        }}
      >
        {emails.map((email) => (
          <motion.div
            key={email._id || email.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <EmailCard email={email} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Inbox;
