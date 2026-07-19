function ErrorMessage({ title, message }) {
  return (
    <div className="error-card" role="alert">
      <h4>{title}</h4>
      <p>{message}</p>
    </div>
  );
}

export default ErrorMessage;
