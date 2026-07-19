function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}

export default AuthCard;
