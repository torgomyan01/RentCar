const PHONE_PREFIX = '+7 (';

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

export function phoneMaskOnFocus(
  currentValue: string,
  setter: (v: string) => void
): void {
  if (!currentValue || currentValue.trim() === '') {
    setter(PHONE_PREFIX);
  }
}

export function phoneMaskOnBlur(
  currentValue: string,
  setter: (v: string) => void
): void {
  const digits = String(currentValue || '').replace(/\D/g, '');
  if (!digits || digits === '7') {
    setter('');
  }
}

export function phoneMaskOnKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  currentValue: string,
  setter: (v: string) => void
): void {
  if (e.key === 'Backspace') {
    const stripped = currentValue.replace(/\D/g, '');
    if (!stripped || stripped === '7') {
      e.preventDefault();
      setter(PHONE_PREFIX);
      return;
    }

    e.preventDefault();
    const shorter = stripped.slice(0, -1);
    if (!shorter || shorter === '7') {
      setter(PHONE_PREFIX);
    } else {
      setter(formatPhoneMask(shorter));
    }
  }
}

export function getPhoneDigits(masked: string): string {
  return String(masked || '').replace(/\D/g, '');
}
