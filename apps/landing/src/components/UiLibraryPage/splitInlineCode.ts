/**
 * Splits TSDoc prose into plain runs and the words it marks as code with backticks, so a summary
 * can show `<button>` as code rather than with its backticks printed around it.
 *
 * @param text - The prose.
 * @returns Its runs in order, each saying whether it is code. An unclosed backtick is kept as text.
 */
const splitInlineCode = (text: string): { text: string; isCode: boolean }[] => {
  const parts = text.split('`');
  const closed =
    parts.length % 2 === 1
      ? parts
      : [...parts.slice(0, -2), `${parts.at(-2) ?? ''}\`${parts.at(-1) ?? ''}`];

  return closed
    .map((part, at) => ({ text: part, isCode: at % 2 === 1 }))
    .filter((part) => part.text !== '');
};

export { splitInlineCode };
