import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  content?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  content,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = 'confirm-dialog-title';
  const descriptionId = 'confirm-dialog-description';
  const dialogContent = content ?? description;

  useEffect(() => {
    if (open) cancelButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className='confirm-backdrop' role='presentation'>
      <div
        className='confirm-dialog'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={dialogContent ? descriptionId : undefined}
        aria-busy={loading}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !loading) onCancel();
        }}
      >
        <h2 id={titleId}>{title}</h2>
        {dialogContent && <div id={descriptionId} className='confirm-dialog-content'>{dialogContent}</div>}
        <div className='confirm-dialog-actions'>
          <button
            ref={cancelButtonRef}
            className='button button-secondary'
            type='button'
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className='button button-danger'
            type='button'
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className='spinner spinner-small' aria-hidden='true' />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
