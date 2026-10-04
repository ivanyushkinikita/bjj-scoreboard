import type { InputHTMLAttributes } from "react";

export interface NameInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onChange: (value: string) => void;
}
