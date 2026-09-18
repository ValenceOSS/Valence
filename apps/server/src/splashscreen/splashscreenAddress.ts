/**
 * Where the picture behind the way in is read from, naming the file it currently is so that a new
 * picture is a new address — and so that the old one can be cached for as long as it lives.
 *
 * @param file - The name the picture is kept under.
 * @returns The address.
 */
const splashscreenAddress = (file: string): string =>
  `/api/splashscreen?v=${encodeURIComponent(file)}`;

export { splashscreenAddress };
