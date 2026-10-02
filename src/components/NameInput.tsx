import type { InputHTMLAttributes } from 'react';
import { titleCaseName } from '../domain/names';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  onChange: (value: string) => void;
};

/** Keeps athlete names consistent everywhere they are entered. */
export function NameInput({ onChange, ...props }: Props) {
  return <input {...props} onChange={event => onChange(titleCaseName(event.target.value))}/>;
}
