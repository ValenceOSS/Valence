/**
 * Says when something happened the way somebody would read it rather than as a timestamp, or
 * nothing where the moment cannot be read, so each sentence it would have filled can be said
 * without it rather than with a vague stand-in.
 *
 * @param when - When it happened.
 * @returns The moment as words, or null.
 */
const saidWhen = (when: string): string | null => {
  const at = new Date(when);

  return Number.isNaN(at.getTime())
    ? null
    : at.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export { saidWhen };
