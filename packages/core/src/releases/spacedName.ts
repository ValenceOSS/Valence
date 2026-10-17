/**
 * A release name with the dots and underscores scene names use between words turned into spaces,
 * and a source written against its resolution, as in `BD1080p` or `WEB720p`, pulled apart, so every
 * reader can look for words rather than for each way of joining them.
 *
 * @param name - The release name.
 * @returns It with its words spaced.
 */
const spacedName = (name: string): string =>
  name
    .replace(/[._]+/g, ' ')
    .replace(/\b(bd|hd|fhd|uhd|web|dvd)(?=(?:2160|1080|720|576|480)[pi]\b)/gi, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

export { spacedName };
