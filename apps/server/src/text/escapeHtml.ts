const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Makes text safe to put inside HTML, as an element's content or a quoted attribute.
 *
 * @param text - The text.
 * @returns The text with every character HTML treats specially escaped.
 */
const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (found) => ESCAPES[found] ?? '');

export { escapeHtml };
