function TaskCard({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className="result-card task-card">
      <div className="result-card-header">
        <span className="result-icon">☑</span>
        <h4>Extracted Tasks</h4>
      </div>
      <ul>
        {tasks.map((task, index) => {
          const title = task?.title || task;
          return (
            <li key={`${title}-${index}`}>
              <span className="task-check">✓</span>
              <span>{title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TaskCard;
