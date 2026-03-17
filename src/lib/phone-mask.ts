export function formatPhoneMask(rawValue: string): string {
  const digitsOnly = String(rawValue || '').replace(/\D/g, '');
  if (!digitsOnly) return '';

  let digits = digitsOnly;

  if (digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.startsWith('9')) {
    digits = `7${digits}`;
  } else if (!digits.startsWith('7')) {
    digits = `7${digits}`;
  }

  digits = digits.slice(0, 11);

  const country = '+7';
  const part1 = digits.slice(1, 4);
  const part2 = digits.slice(4, 7);
  const part3 = digits.slice(7, 9);
  const part4 = digits.slice(9, 11);

  let result = country;
  if (part1) result += ` (${part1}`;
  if (part1.length === 3) result += ')';
  if (part2) result += ` ${part2}`;
  if (part3) result += `-${part3}`;
  if (part4) result += `-${part4}`;

  return result;
}
