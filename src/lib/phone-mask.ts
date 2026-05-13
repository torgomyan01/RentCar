// Phone mask helpers used with `@react-input/mask`.
//
// IMPORTANT: `@react-input/mask` (the `InputMask` component) already handles
// every aspect of mask UX correctly: digit insertion, deletion in the middle
// of the value, caret movement, range selection, paste etc. Any extra
// `onKeyDown` / `onFocus` / `onMouseDown` logic that calls `preventDefault()`
// and rewrites the value will fight the library and cause "wrong digit
// changes" while editing.
//
// Therefore this module only exposes two tiny helpers:
//   - `getPhoneDigits`: strip everything but digits (used for validation /
//     sending the number to the backend).
//   - `phoneMaskOnBlur`: when the user leaves the field without typing any
//     real digit, clear the value so the placeholder shows up again instead
//     of a half-empty mask like "+7 ___-___-__-__".

export function getPhoneDigits(masked: string): string {
  return String(masked || '').replace(/\D/g, '');
}

/**
 * Returns true when the field contains no real digits beyond the country
 * code prefix (i.e. user has not actually entered a phone number).
 */
export function isPhoneEmpty(masked: string): boolean {
  const digits = getPhoneDigits(masked);
  return !digits || digits === '7';
}

/**
 * Clear the controlled value if the user leaves the field without typing
 * any real digits, so the input placeholder can show again.
 */
export function phoneMaskOnBlur(
  currentValue: string,
  setter: (v: string) => void
): void {
  if (isPhoneEmpty(currentValue)) {
    setter('');
  }
}
