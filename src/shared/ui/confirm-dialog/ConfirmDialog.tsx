import { useTranslation } from "../../../app/i18n";
import { Modal } from "../modal/Modal";
import type { ConfirmDialogProps } from "./ConfirmDialog.types";

export function ConfirmDialog({
  cancelLabel = "Cancel",
  children,
  closeOnBackdrop = false,
  confirmLabel,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal title={title} close={onCancel} closeOnBackdrop={closeOnBackdrop}>
      <p>{children}</p>
      <div className="dialog-actions">
        <button type="button" onClick={onCancel}>
          {t(cancelLabel)}
        </button>
        <button type="button" className="primary" onClick={onConfirm}>
          {t(confirmLabel)}
        </button>
      </div>
    </Modal>
  );
}
