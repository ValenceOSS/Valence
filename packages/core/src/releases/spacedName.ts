/**
 * A release name with the dots and underscores scene names use between words turned into spaces,
 * so every reader can look for words rather than for each way of joining them.
 *
 * @param name - The release name.
 * @returns It with its words spaced.
 */
const spacedName = (name: string): string =>
  name.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();

export { spacedName };
