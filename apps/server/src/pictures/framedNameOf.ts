import { extname } from 'node:path';

/**
 * The name a face's framed picture is kept under, beside the processed one: the original's name,
 * marked as framed, as WebP.
 *
 * @param name - The original's file name.
 * @returns The framed picture's file name.
 */
const framedNameOf = (name: string): string =>
  `${name.slice(0, name.length - extname(name).length)}.framed.webp`;

export { framedNameOf };
