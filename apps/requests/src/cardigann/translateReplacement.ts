/**
 * Turns a .NET replacement string into the JavaScript one, where `$0` means the whole match.
 *
 * @param replacement - The replacement as written.
 * @returns The replacement.
 */
const translateReplacement = (replacement: string): string =>
  replacement.replace(/\$0(?!\d)/g, '$$&');

export { translateReplacement };
