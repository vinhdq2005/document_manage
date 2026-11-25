import { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">×</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmText = 'Xác nhận', danger = false, busy = false, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Hủy</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xử lý…' : confirmText}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
