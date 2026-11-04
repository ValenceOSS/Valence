/**
 * The one value every file of a title shares, so a column can say it once for the whole title.
 *
 * @param values - Each file's value.
 * @param mixed - What to say when they differ.
 * @returns The shared value, what to say when they differ, or nothing when there are no files.
 */
const sharedOf = (values: readonly string[], mixed: string): string | null =>
  values.length === 0 ? null : new Set(values).size === 1 ? (values[0] ?? null) : mixed;

export { sharedOf };
