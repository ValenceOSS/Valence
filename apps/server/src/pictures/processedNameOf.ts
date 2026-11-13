import { extname } from 'node:path';

/**
 * The name a face's processed picture is kept under, beside the original it was made from: the
 * same name, as WebP.
 *
 * @param name - The original's file name.
 * @returns The processed picture's file name.
 */
const processedNameOf = (name: string): string =>
  `${name.slice(0, name.length - extname(name).length)}.webp`;

export { processedNameOf };
