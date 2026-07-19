import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import {
  extractTasks,
  generateReply,
  summarizeEmail,
} from "../services/aiService";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import ReplyCard from "../components/ReplyCard";
import SummaryCard from "../components/SummaryCard";
import TaskCard from "../components/TaskCard";

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
        setError("Unable to connect to backend.");
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
      setError("Email body is empty. There is nothing to process.");
      return;
    }

    setError("");
    setActiveAction(action);
    setCopied(false);

    try {
      if (action === "summarize") {
        const result = await summarizeEmail(email);
        setSummary(result || "No summary returned.");
        setGeneratedReply("");
        setTasks([]);
      } else if (action === "reply") {
        const result = await generateReply(email);
        setGeneratedReply(result || "No reply returned.");
        setSummary("");
        setTasks([]);
      } else if (action === "tasks") {
        const result = await extractTasks(email);
        setTasks(result || []);
        setSummary("");
        setGeneratedReply("");
      }
    } catch (requestError) {
      setError(
        requestError.message || "AI request failed. Make sure the backend is running."
      );
      setSummary("");
      setGeneratedReply("");
      setTasks([]);
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
    return (
      <div className="page-shell">
        <LoadingSpinner label="Loading email..." />
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="page-shell">
        <ErrorMessage title="Email unavailable" message={error} />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="page-shell">
        <ErrorMessage title="Email not found" message="The requested email could not be found." />
      </div>
    );
  }

  const priorityClass = (email.priority || "medium").toLowerCase();
  const body = email.body || email.content || email.message || "";
  const receivedAt = email.receivedAt || email.date || email.createdAt || "";
  const formatDate = (value) => {
    if (!value) {
      return "No date";
    }

    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
      return value;
    }

    return dateValue.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <section className="email-details">
      <Link to="/inbox" className="back-link">← Back to Inbox</Link>

      <div className="email-details-header">
        <div>
          <h1>{email.subject}</h1>
          <p>
            From: {email.senderName || email.sender || email.senderEmail || "Unknown sender"}
          </p>
          <p>To: {email.recipient || email.to || "Unknown recipient"}</p>
          <p className="detail-meta">{formatDate(receivedAt)}</p>
        </div>

        {email.priority && (
          <span className={`priority ${priorityClass}`}>{email.priority}</span>
        )}
      </div>

      <hr />

      <div className="email-body-card">
        <h3>Email Body</h3>
        <p className="email-body">{body}</p>
      </div>

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

      {error && <ErrorMessage title="AI request failed" message={error} />}

      <div className="results-stack">
        <SummaryCard title="AI Summary" content={summary} />
        <ReplyCard reply={generatedReply} copied={copied} onCopy={handleCopyReply} />
        <TaskCard tasks={tasks} />
      </div>
    </section>
  );
}

export default EmailDetails;