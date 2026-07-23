import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckSquare, Sparkles } from "lucide-react";
import api from "../services/api";
import {
  extractTasks,
  generateReply,
  summarizeEmail,
} from "../services/aiService";
import Avatar from "../components/Avatar";
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

const TABS = [
  { value: "summary", label: "Summary" },
  { value: "reply", label: "Reply" },
  { value: "tasks", label: "Tasks" },
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
  const [activeTab, setActiveTab] = useState("summary");

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
  const senderName =
    email.senderName || email.sender || email.senderEmail || "Unknown sender";

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
        <ArrowLeft size={15} strokeWidth={2.25} />
        Back to Inbox
      </Link>

      <motion.div
        className="email-details-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="email-details-main">
          <div className="email-details-header">
            <div className="email-details-identity">
              <Avatar name={senderName} size={52} />
              <div>
                <h1>{email.subject}</h1>
                <p>
                  From: <strong>{senderName}</strong>
                </p>
                <p>To: {email.recipient || email.to || "Unknown recipient"}</p>
                <p className="detail-meta">{formatDate(receivedAt)}</p>
              </div>
            </div>

            {email.priority && (
              <span className={`priority priority--${priorityClass}`}>
                {email.priority}
              </span>
            )}
          </div>

          <div className="email-body-card">
            <h3>Email Body</h3>
            <p className="email-body">{body}</p>
          </div>

          {error && <ErrorMessage title="AI request failed" message={error} />}
        </div>

        <aside className="ai-workspace">
          <div className="ai-workspace-header">
            <span className="ai-workspace-eyebrow">
              <Sparkles size={13} strokeWidth={2.25} />
              AI workspace
            </span>
            <p>Summarize, draft a reply, or pull out tasks from this email.</p>
          </div>

          <div className="email-actions">
            <button
              type="button"
              className="ai-action-button"
              onClick={() => {
                setActiveTab("summary");
                handleAction("summarize");
              }}
              disabled={activeAction === "summarize"}
            >
              <Sparkles size={14} strokeWidth={2.25} />
              {activeAction === "summarize" ? "Summarizing..." : "Summarize"}
            </button>

            <div className="reply-control-group">
              <div className="tone-selector" role="group" aria-label="Reply tone">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`tone-option ${tone === option.value ? "active" : ""}`}
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
                className="ai-action-button"
                onClick={() => {
                  setActiveTab("reply");
                  handleAction("reply");
                }}
                disabled={activeAction === "reply"}
              >
                {activeAction === "reply" ? "Generating reply..." : "Generate Reply"}
              </button>
            </div>

            <button
              type="button"
              className="ai-action-button"
              onClick={() => {
                setActiveTab("tasks");
                handleAction("tasks");
              }}
              disabled={activeAction === "tasks"}
            >
              <CheckSquare size={14} strokeWidth={2.25} />
              {activeAction === "tasks" ? "Extracting tasks..." : "Extract Tasks"}
            </button>
          </div>

          <div className="ai-tabs">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                className={activeTab === value ? "tab active" : "tab"}
                disabled={activeAction !== ""}
                onClick={() => setActiveTab(value)}
              >
                {label}
                {activeTab === value && (
                  <motion.span className="tab-indicator" layoutId="tab-indicator" />
                )}
              </button>
            ))}
          </div>

          <div className="tab-content">
            <AnimatePresence mode="wait">
              {activeAction !== "" && (
                <motion.div
                  key="ai-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ai-thinking"
                >
                  <span className="signal-thread signal-thread--pulse" />
                  <span>Reading the email...</span>
                </motion.div>
              )}

              {activeAction === "" && activeTab === "summary" && summary && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <SummaryCard title="AI Summary" content={summary} />
                </motion.div>
              )}

              {activeAction === "" && activeTab === "reply" && generatedReply && (
                <motion.div
                  key="reply"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ReplyCard
                    reply={generatedReply}
                    onChangeReply={handleChangeReply}
                    onCopy={handleCopyReply}
                    onRegenerate={() => handleAction("reply")}
                    onClear={handleClearReply}
                    copied={copied}
                    regenerating={activeAction === "reply"}
                  />
                </motion.div>
              )}

              {activeAction === "" && activeTab === "tasks" && tasks !== null && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <TaskCard tasks={tasks} />
                </motion.div>
              )}

              {activeAction === "" &&
                ((activeTab === "summary" && !summary) ||
                  (activeTab === "reply" && !generatedReply) ||
                  (activeTab === "tasks" && tasks === null)) && (
                  <motion.p
                    key="empty"
                    className="ai-tab-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Run an action above to see results here.
                  </motion.p>
                )}
            </AnimatePresence>
          </div>
        </aside>
      </motion.div>
    </section>
  );
}

export default EmailDetails;
