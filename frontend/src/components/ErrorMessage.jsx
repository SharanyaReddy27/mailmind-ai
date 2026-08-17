import { AlertTriangle } from "lucide-react";

function ErrorMessage({ title, message }) {
  return (
    <div className="error-card" role="alert">
      <span className="error-icon">
        <AlertTriangle size={16} strokeWidth={2.25} />
      </span>
      <div>
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default ErrorMessage;
