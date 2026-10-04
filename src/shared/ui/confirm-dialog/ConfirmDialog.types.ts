import type { ReactNode } from "react";

export interface ConfirmDialogProps {
  cancelLabel?: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}
