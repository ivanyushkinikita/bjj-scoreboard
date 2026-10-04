import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { useTranslation } from "../../../app/i18n";
import { CloseButton, Dialog, Header, TitleRow } from "./Modal.styles";
import type { ModalProps } from "./Modal.types";

export function Modal({
  title,
  titleAccessory,
  children,
  close,
  closeOnBackdrop = false,
}: ModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (!close) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [close]);

  return createPortal(
    <Dialog
      aria-label={t(title)}
      ref={dialogRef}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) close?.();
      }}
      onSubmit={(event) => event.stopPropagation()}
      onCancel={(event) => {
        event.preventDefault();
        close?.();
      }}
    >
      <Header>
        <TitleRow>
          <h2>{t(title)}</h2>
          {titleAccessory}
        </TitleRow>
        {close && (
          <CloseButton
            type="button"
            aria-label={t("Close dialog")}
            onClick={close}
          >
            ×
          </CloseButton>
        )}
      </Header>
      {children}
    </Dialog>,
    document.body,
  );
}
