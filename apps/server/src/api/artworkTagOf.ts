import { createHash } from 'node:crypto';

/**
 * Names which picture an artwork address stands for, as the tag a browser sends back to ask whether
 * what it holds is still right. Drawn from where the picture came from, so choosing another picture
 * changes the tag and the same one keeps it.
 *
 * @param url - Where the picture came from.
 * @returns The tag, quoted as HTTP writes one.
 */
const artworkTagOf = (url: string): string =>
  `"${createHash('sha256').update(url).digest('base64url').slice(0, 22)}"`;

export { artworkTagOf };
