import { useEffect, useState } from "react";
import { getEmails, getErrorMessage } from "../services/api";
import EmailCard from "../components/EmailCard";

function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getEmails()
      .then((response) => {
        setEmails(response.data);
        setError("");
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading emails...</p>;
  }

  return (
    <div>
      <h1>MailMind Inbox</h1>

      {error && <p>{error}</p>}

      {emails.map((email) => (
        <EmailCard key={email._id || email.id} email={email} />
      ))}
    </div>
  );
}

export default Inbox;