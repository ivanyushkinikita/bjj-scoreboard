import type { ReactNode } from "react";

export interface ModalProps {
  children: ReactNode;
  close?: () => void;
  closeOnBackdrop?: boolean;
  title: string;
  titleAccessory?: ReactNode;
}
