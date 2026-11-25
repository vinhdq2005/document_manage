import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const push = useCallback((type, text) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, type, text }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const api = useRef({
    success: (t) => push('success', t),
    error: (t) => push('error', t),
  });
  api.current.success = (t) => push('success', t);
  api.current.error = (t) => push('error', t);

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const timer = setTimeout(() => doneRef.current(), toast.type === 'error' ? 7000 : 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type]);
  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.text}</span>
      <button type="button" className="toast-close" onClick={onDone} aria-label="Đóng thông báo">×</button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
