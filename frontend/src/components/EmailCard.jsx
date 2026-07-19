import { useState } from "react";
import { Link } from "react-router-dom";
import {
  generateReply,
  getErrorMessage,
  extractTasks,
  summarizeEmail,
} from "../services/api";

function EmailCard({ email }) {
  const [summary, setSummary] = useState("");
  const [reply, setReply] = useState("");
  const [tasks, setTasks] = useState([]);
  const [actionError, setActionError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const handleSummarize = async (event) => {
    event.preventDefault();
    setActionError("");
    setLoadingAction("summarize");

    try {
      const response = await summarizeEmail({
        subject: email.subject || "",
        sender: email.senderEmail || email.sender || "",
        body: email.body || email.message || email.snippet || "",
      });

      setSummary(response.data.summary || "");
    } catch (error) {
      setSummary("");
      setActionError(getErrorMessage(error));
    } finally {
      setLoadingAction("");
    }
  };

  const handleGenerateReply = async (event) => {
    event.preventDefault();
    setActionError("");
    setLoadingAction("reply");

    try {
      const response = await generateReply({
        subject: email.subject || "",
        sender: email.senderEmail || email.sender || "",
        body: email.body || email.message || email.snippet || "",
      });

      setReply(response.data.reply || "");
    } catch (error) {
      setReply("");
      setActionError(getErrorMessage(error));
    } finally {
      setLoadingAction("");
    }
  };

  const handleExtractTasks = async (event) => {
    event.preventDefault();
    setActionError("");
    setLoadingAction("tasks");

    try {
      const response = await extractTasks({
        subject: email.subject || "",
        sender: email.senderEmail || email.sender || "",
        body: email.body || email.message || email.snippet || "",
      });

      const extractedTasks = (response.data.tasks || []).map((task) =>
        typeof task === "string" ? task : task.title || "Untitled task"
      );

      setTasks(extractedTasks.length > 0 ? extractedTasks : ["No specific tasks found."]);
    } catch (error) {
      setTasks([]);
      setActionError(getErrorMessage(error));
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <article className={`email-card ${email.unread ? "unread" : ""}`}>
      <Link
        to={`/emails/${email._id}`}
        className="email-card-link"
      >
        <div className="email-header">
          <div>
            <h3>{email.senderName || email.sender}</h3>
            <p>{email.senderEmail || email.email}</p>
          </div>

          {email.priority && (
            <span
              className={`priority ${email.priority.toLowerCase()}`}
            >
              {email.priority}
            </span>
          )}
        </div>

        <h4>{email.subject}</h4>

        <p>
          {email.snippet ||
            email.body ||
            email.message ||
            "No email content available."}
        </p>

        <span>
          {email.unread || email.isRead === false
            ? "Unread"
            : "Read"}
        </span>
      </Link>

      <div className="email-actions">
        <button onClick={handleSummarize}>
          Summarize
        </button>

        <button onClick={handleGenerateReply}>
          Generate Reply
        </button>

        <button onClick={handleExtractTasks}>
          Extract Tasks
        </button>
      </div>

      {loadingAction && <p>Processing request...</p>}
      {actionError && <p>{actionError}</p>}

      {summary && (
        <div className="result-box">
          <h4>Summary</h4>
          <p>{summary}</p>
        </div>
      )}

      {reply && (
        <div className="result-box">
          <h4>Generated Reply</h4>
          <pre>{reply}</pre>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="result-box">
          <h4>Extracted Tasks</h4>

          <ul>
            {tasks.map((task, index) => (
              <li key={index}>{task}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default EmailCard;