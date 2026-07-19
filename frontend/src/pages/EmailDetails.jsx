import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import {
  extractTasks,
  generateReply,
  summarizeEmail,
} from "../services/aiService";

function EmailDetails() {
  const { id } = useParams();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [tasks, setTasks] = useState([]);
  const [activeAction, setActiveAction] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get(`/emails/${id}`)
      .then((response) => {
        setEmail(response.data);
        setError("");
      })
      .catch(() => {
        setError("Unable to load this email.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleAction = async (action) => {
    if (!email) {
      return;
    }

    const body = email.body || email.content || email.message || "";

    if (!body.trim()) {
      setError("This email does not have any body content to process.");
      return;
    }

    setError("");
    setActiveAction(action);
    setCopied(false);

    try {
      if (action === "summarize") {
        const result = await summarizeEmail(email);
        setSummary(result);
        setGeneratedReply("");
        setTasks([]);
      } else if (action === "reply") {
        const result = await generateReply(email);
        setGeneratedReply(result);
        setSummary("");
        setTasks([]);
      } else if (action === "tasks") {
        const result = await extractTasks(email);
        setTasks(result);
        setSummary("");
        setGeneratedReply("");
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to process this email. Make sure the backend is running."
      );
    } finally {
      setActiveAction("");
    }
  };

  const handleCopyReply = async () => {
    if (!generatedReply) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return <p>Loading email...</p>;
  }

  if (error && !email) {
    return <p>{error}</p>;
  }

  if (!email) {
    return <p>Email not found.</p>;
  }

  const priorityClass = (email.priority || "medium").toLowerCase();
  const body = email.body || email.content || email.message || "";

  return (
    <section className="email-details">
      <Link to="/inbox">← Back to Inbox</Link>

      <div className="email-details-header">
        <div>
          <h1>{email.subject}</h1>
          <p>
            From: {email.senderName || email.sender || email.senderEmail || "Unknown sender"}
          </p>
        </div>

        {email.priority && (
          <span className={`priority ${priorityClass}`}>
            {email.priority}
          </span>
        )}
      </div>

      <hr />

      <p className="email-body">{body}</p>

      <div className="email-actions">
        <button
          type="button"
          onClick={() => handleAction("summarize")}
          disabled={activeAction === "summarize"}
        >
          {activeAction === "summarize" ? "Summarizing..." : "Summarize"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("reply")}
          disabled={activeAction === "reply"}
        >
          {activeAction === "reply" ? "Generating..." : "Generate Reply"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("tasks")}
          disabled={activeAction === "tasks"}
        >
          {activeAction === "tasks" ? "Extracting..." : "Extract Tasks"}
        </button>
      </div>

      {error && <p className="result-box">{error}</p>}

      {summary && (
        <div className="result-box">
          <h4>AI Summary</h4>
          <p>{summary}</p>
        </div>
      )}

      {generatedReply && (
        <div className="result-box">
          <h4>Suggested Reply</h4>
          <pre>{generatedReply}</pre>
          <button type="button" className="copy-button" onClick={handleCopyReply}>
            {copied ? "Copied!" : "Copy Reply"}
          </button>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="result-box">
          <h4>Extracted Tasks</h4>
          <ul>
            {tasks.map((task, index) => (
              <li key={`${task.title || "task"}-${index}`}>
                {task.title || task}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!summary && !generatedReply && tasks.length === 0 && !error && (
        <div className="result-box">
          <p>Choose an action to analyze this email.</p>
        </div>
      )}
    </section>
  );
}

export default EmailDetails;