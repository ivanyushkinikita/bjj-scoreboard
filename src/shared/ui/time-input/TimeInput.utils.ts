export const maximumDuration = 99 * 60000 + 59000;

export function maskTime(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4).padEnd(4, "0");
  const seconds = Math.min(59, Number(digits.slice(2, 4)));

  return `${digits.slice(0, 2)}:${seconds.toString().padStart(2, "0")}`;
}
