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
const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
];

function EmailDetails() {
  const { id } = useParams();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [tone, setTone] = useState("professional");
  const [tasks, setTasks] = useState(null);
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
        setTasks(null);
      } else if (action === "reply") {
        const result = await generateReply(email, tone);
        setGeneratedReply(result || "No reply returned.");
        setSummary("");
        setTasks(null);
      } else if (action === "tasks") {
        const result = await extractTasks(email);
        setTasks(result || []);
        setSummary("");
        setGeneratedReply("");
      }
  } catch (requestError) {
 if (action === "reply") {
  setSummary("");
  setTasks(null);
  setGeneratedReply("");

  setError(
    "We couldn't generate a reply right now. Please try again."
  );
}
else if (action === "tasks") {
    setError("Couldn't extract tasks. Please try again.");
}
 else {
    setError(
      requestError.message ||
        "AI request failed. Make sure the backend is running."
    );

    setSummary("");
    setGeneratedReply("");
    setTasks([]);
  }
  
} finally {
      setActiveAction("");
    }
  };
const handleChangeReply = (value) => {
  setGeneratedReply(value);
  setCopied(false);
};

const handleClearReply = () => {
  setGeneratedReply("");
  setCopied(false);
  setError("");
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
        <ErrorMessage
          title="Email not found"
          message="The requested email could not be found."
        />
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
      <Link to="/inbox" className="back-link">
        ← Back to Inbox
      </Link>

      <div className="email-details-header">
        <div>
          <h1>{email.subject}</h1>

          <p>
            From:{" "}
            {email.senderName ||
              email.sender ||
              email.senderEmail ||
              "Unknown sender"}
          </p>

          <p>To: {email.recipient || email.to || "Unknown recipient"}</p>

          <p className="detail-meta">{formatDate(receivedAt)}</p>
        </div>

        {email.priority && (
          <span className={`priority ${priorityClass}`}>
            {email.priority}
          </span>
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
          {activeAction === "summarize"
            ? "Summarizing..."
            : "Summarize"}
        </button>

        <div className="reply-control-group">

  <div
    className="tone-selector"
    role="group"
    aria-label="Reply tone"
  >
    {TONE_OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        className={`tone-option ${
          tone === option.value ? "active" : ""
        }`}
        onClick={() => setTone(option.value)}
        aria-pressed={tone === option.value}
        disabled={activeAction === "reply"}
      >
        {option.label}
      </button>
    ))}
  </div>

  <button
    type="button"
    onClick={() => handleAction("reply")}
    disabled={activeAction === "reply"}
  >
    {activeAction === "reply"
      ? "Generating reply..."
      : "Generate Reply"}
  </button>

</div>

        <button
          type="button"
          onClick={() => handleAction("tasks")}
          disabled={activeAction === "tasks"}
        >
          {activeAction === "tasks"
    ? "Extracting tasks..."
    : "Extract Tasks"}
        </button>
      </div>

      {error && (
        <ErrorMessage title="AI request failed" message={error} />
      )}

      <div className="results-stack">
        <SummaryCard title="AI Summary" content={summary} />

      <ReplyCard
  reply={generatedReply}
  onChangeReply={handleChangeReply}
  onCopy={handleCopyReply}
  onRegenerate={() => handleAction("reply")}
  onClear={handleClearReply}
  copied={copied}
  regenerating={activeAction === "reply"}
/>

        <TaskCard tasks={tasks} />
      </div>
    </section>
  );
}

export default EmailDetails;