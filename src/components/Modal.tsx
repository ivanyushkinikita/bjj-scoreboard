import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from '../app/i18n';
import { createPortal } from 'react-dom';
export function Modal({ title, titleAccessory, children, close }: { title: string; titleAccessory?: ReactNode; children: ReactNode; close?: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current!; d.showModal(); return () => d.close(); }, []);
  return createPortal(<dialog aria-label={t(title)} ref={ref} onSubmit={e=>e.stopPropagation()} onCancel={e => { e.preventDefault(); close?.(); }}><div className="modal-head"><div className="modal-title-row"><h2>{t(title)}</h2>{titleAccessory}</div>{close && <button type="button" aria-label={t("Close dialog")} onClick={close}>×</button>}</div>{children}</dialog>,document.body);
}
