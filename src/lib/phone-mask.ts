const PHONE_PREFIX = '+7 ';
const CARET_MIN_POS = 3; // "+7 "

function moveCaretAfterPrefix(input: HTMLInputElement | null | undefined) {
  if (!input) return;
  const pos = CARET_MIN_POS;
  try {
    // Ensure caret is always after "+7 "
    input.setSelectionRange(pos, pos);
  } catch {
    // ignore (some browsers/input types may throw)
  }
}

function moveCaretToSafeEnd(input: HTMLInputElement | null | undefined) {
  if (!input) return;
  const valueLen = String(input.value || '').length;
  const pos = Math.max(CARET_MIN_POS, valueLen);
  try {
    input.setSelectionRange(pos, pos);
  } catch {
    // ignore
  }
}

function moveCaretAfterPrefixWithRetry(
  input: HTMLInputElement | null | undefined,
  attemptsLeft: number
) {
  if (!input) return;
  moveCaretToSafeEnd(input);
  if (attemptsLeft <= 0) return;

  // If mask hasn't been applied yet (first click before React rerender),
  // retry on next frame to ensure caret ends up after "+7 ".
  if (!String(input.value || '').startsWith('+7')) {
    requestAnimationFrame(() =>
      moveCaretAfterPrefixWithRetry(input, attemptsLeft - 1)
    );
  }
}

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
  setter: (v: string) => void,
  inputEl?: HTMLInputElement | null
): void {
  // On focus we always initialize prefix in controlled value.
  if (!currentValue || currentValue.trim() === '') {
    setter(PHONE_PREFIX);
  }

  // `InputMask` updates value async; apply caret after updates.
  queueMicrotask(() => {
    requestAnimationFrame(() => moveCaretAfterPrefixWithRetry(inputEl, 2));
  });
}

export function phoneMaskForceCaretToEnd(inputEl?: HTMLInputElement | null) {
  queueMicrotask(() => {
    requestAnimationFrame(() => moveCaretAfterPrefixWithRetry(inputEl, 2));
  });
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
  const isSingleChar = e.key.length === 1;
  const isDigit = /\d/.test(e.key);
  const hasModifier = e.ctrlKey || e.metaKey || e.altKey;
  const isEmpty = !currentValue || currentValue.trim() === '';
  const hasOnlyPrefix = String(currentValue || '').trim() === '+7';

  // Ignore first user digit 7/8 (users often type full number with country code).
  if (
    (isEmpty || hasOnlyPrefix) &&
    isSingleChar &&
    isDigit &&
    !hasModifier &&
    (e.key === '7' || e.key === '8')
  ) {
    e.preventDefault();
    setter(PHONE_PREFIX);
    return;
  }

  // If user starts typing into empty field, initialize deterministically:
  // set "+7 " and first digit in one step.
  if (isEmpty && isSingleChar && isDigit && !hasModifier) {
    e.preventDefault();
    setter(`${PHONE_PREFIX}${e.key}`);
    return;
  }

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
