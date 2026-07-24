import { useState } from "react";
import { CalendarDays, CheckSquare, Copy, Download, RotateCcw, User } from "lucide-react";

function TaskCard({ tasks, onRetry, retrying }) {
  const [checkedTasks, setCheckedTasks] = useState({});
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (tasks === null) {
    return null;
  }

  const toggleTask = (key) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatTask = (task) => {
    const lines = [`- ${task.title}`];
    if (task.deadline) lines.push(`Deadline: ${task.deadline}`);
    if (task.priority) lines.push(`Priority: ${task.priority}`);
    return lines.join("\n");
  };

  const handleCopyAll = async () => {
    const text = tasks.map(formatTask).join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyOne = async (task, index) => {
    try {
      await navigator.clipboard.writeText(formatTask(task));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1200);
    } catch {
      setCopiedIndex(null);
    }
  };

  const handleExport = () => {
    const text = tasks.map(formatTask).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mailmind-tasks.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (tasks.length === 0) {
    return (
      <div className="result-card task-card signal-card">
        <div className="result-card-header">
          <span className="result-icon">
            <CheckSquare size={14} strokeWidth={2.25} />
          </span>
          <h4>Extracted Tasks</h4>
        </div>

        <p className="empty-state">
          No actionable tasks found in this email.
        </p>

        {onRetry && (
          <button
            type="button"
            className="secondary-button"
            onClick={onRetry}
            disabled={retrying}
          >
            <RotateCcw size={14} strokeWidth={2.25} />
            {retrying ? "Retrying..." : "Retry"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="result-card task-card signal-card">
      <div className="result-card-header">
        <span className="result-icon">
          <CheckSquare size={14} strokeWidth={2.25} />
        </span>
        <h4>Extracted Tasks</h4>
      </div>

      <div className="task-list">
        {tasks.map((task, index) => {
          const key = `${task.title}-${index}`;
          const checked = checkedTasks[key];

          return (
            <div className="task-item" key={key}>
              <input
                type="checkbox"
                checked={checked || false}
                onChange={() => toggleTask(key)}
              />

              <div className={`task-content ${checked ? "task-done" : ""}`}>
                <div className="task-top-row">
                  <span className="task-title">{task.title}</span>

                  <span
                    className={`task-priority priority-${task.priority?.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta-row">
                  {task.deadline && (
                    <span>
                      <CalendarDays size={12} strokeWidth={2.25} />
                      {task.deadline}
                    </span>
                  )}

                  {task.assignee && (
                    <span>
                      <User size={12} strokeWidth={2.25} />
                      {task.assignee}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="task-copy-button"
                onClick={() => handleCopyOne(task, index)}
                aria-label="Copy task"
                title="Copy task"
              >
                <Copy size={13} strokeWidth={2.25} />
                {copiedIndex === index && <span className="task-copy-tooltip">Copied</span>}
              </button>
            </div>
          );
        })}
      </div>

      <div className="reply-toolbar">
        <button className="secondary-button" onClick={handleCopyAll}>
          <Copy size={14} strokeWidth={2.25} />
          {copied ? "Copied!" : "Copy all"}
        </button>

        <button className="secondary-button" onClick={handleExport}>
          <Download size={14} strokeWidth={2.25} />
          Export
        </button>

        {onRetry && (
          <button
            type="button"
            className="secondary-button"
            onClick={onRetry}
            disabled={retrying}
          >
            <RotateCcw size={14} strokeWidth={2.25} />
            {retrying ? "Retrying..." : "Retry"}
          </button>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
