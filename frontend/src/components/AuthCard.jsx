import { Sparkles } from "lucide-react";

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-showcase" aria-hidden="true">
        <span className="brand-mark brand-mark--lg">
          <Sparkles size={20} strokeWidth={2.25} />
        </span>
        <h2 className="auth-showcase-title">MailMind AI</h2>
        <p className="auth-showcase-copy">
          One inbox, read by a second pair of eyes. Summaries, drafted
          replies, and extracted tasks — without leaving the thread.
        </p>
        <div className="auth-showcase-thread" />
      </div>

      <div className="auth-card">
        <div className="auth-card__header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthCard;
