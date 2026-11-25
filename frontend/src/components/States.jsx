export function Spinner({ label = 'Đang tải…' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="state">
      <p className="state-title">{title}</p>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
