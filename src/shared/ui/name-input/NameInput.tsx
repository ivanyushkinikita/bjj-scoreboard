import { titleCaseName } from "../../../domain/names";
import type { NameInputProps } from "./NameInput.types";

/** Keeps athlete names consistent everywhere they are entered. */
export function NameInput({ onChange, ...props }: NameInputProps) {
  return (
    <input
      {...props}
      onChange={(event) => onChange(titleCaseName(event.target.value))}
    />
  );
}
