import { useState } from "react";

function TaskCard({ tasks }) {
  const [checkedTasks, setCheckedTasks] = useState({});
  const [copied, setCopied] = useState(false);

  if (tasks === null) {
    return null;
  }

  const toggleTask = (key) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyAll = async () => {
    const text = tasks
      .map((task) => {
        const lines = [`- ${task.title}`];

        if (task.deadline) lines.push(`Deadline: ${task.deadline}`);
        if (task.priority) lines.push(`Priority: ${task.priority}`);

        return lines.join("\n");
      })
      .join("\n\n");

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

  if (tasks.length === 0) {
    return (
      <div className="result-card task-card">
        <div className="result-card-header">
          <span className="result-icon">☑</span>
          <h4>Extracted Tasks</h4>
        </div>

        <p className="empty-state">
          No actionable tasks found in this email.
        </p>
      </div>
    );
  }

  return (
    <div className="result-card task-card">
      <div className="result-card-header">
        <span className="result-icon">☑</span>
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
                  <span className="task-title">
                    {task.title}
                  </span>

                  <span
                    className={`task-priority priority-${task.priority?.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="task-description">
                    {task.description}
                  </p>
                )}

                <div className="task-meta-row">
                  {task.deadline && (
                    <span>
                      📅 {task.deadline}
                    </span>
                  )}

                  {task.assignee && (
                    <span>
                      👤 {task.assignee}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="secondary-button copy-all-button"
        onClick={handleCopyAll}
      >
        {copied ? "Copied!" : "Copy all tasks"}
      </button>
    </div>
  );
}

export default TaskCard;