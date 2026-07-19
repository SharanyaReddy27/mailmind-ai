import { useEffect, useState } from "react";
import api from "../services/api";
import EmailCard from "../components/EmailCard";

function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/emails")
      .then((response) => {
        setEmails(response.data);
        setError("");
      })
      .catch(() => {
        setError("Backend is not connected.");
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