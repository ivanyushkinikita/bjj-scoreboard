export function titleCaseName(value: string): string {
  return value.replace(/\p{L}+/gu, word => word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase());
}