import { useState } from "react";
import { Link } from "react-router-dom";

function EmailCard({ email }) {
  const [summary, setSummary] = useState("");
  const [reply, setReply] = useState("");
  const [tasks, setTasks] = useState([]);

  const handleSummarize = (event) => {
    event.preventDefault();

    setSummary(
      `${email.subject}: ${
        email.body ||
        email.message ||
        email.snippet ||
        "No email content available."
      }`
    );
  };

  const handleGenerateReply = (event) => {
    event.preventDefault();

    setReply(
      `Hello ${
        email.senderName || email.sender || "there"
      },\n\nThank you for your email regarding "${
        email.subject
      }". I will review it and get back to you soon.\n\nRegards`
    );
  };

  const handleExtractTasks = (event) => {
    event.preventDefault();

    const text =
      email.body || email.message || email.snippet || "";

    const extractedTasks = text
      .split(".")
      .map((sentence) => sentence.trim())
      .filter(
        (sentence) =>
          sentence.toLowerCase().includes("please") ||
          sentence.toLowerCase().includes("schedule") ||
          sentence.toLowerCase().includes("complete") ||
          sentence.toLowerCase().includes("submit") ||
          sentence.toLowerCase().includes("apply")
      );

    setTasks(
      extractedTasks.length > 0
        ? extractedTasks
        : ["No specific tasks found."]
    );
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