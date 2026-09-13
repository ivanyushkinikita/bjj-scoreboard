import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from '../app/i18n';
import { createPortal } from 'react-dom';
export function Modal({ title, children, close }: { title: string; children: ReactNode; close?: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current!; d.showModal(); return () => d.close(); }, []);
  return createPortal(<dialog ref={ref} onSubmit={e=>e.stopPropagation()} onCancel={e => { e.preventDefault(); close?.(); }}><div className="modal-head"><h2>{t(title)}</h2>{close && <button type="button" aria-label={t("Close dialog")} onClick={close}>×</button>}</div>{children}</dialog>,document.body);
}
