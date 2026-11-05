/**
 * Text made safe to name a file or folder with on any system a library might live on: without the
 * characters Windows and macOS refuse, and without trailing dots or spaces.
 *
 * @param text - The text, such as a title.
 * @returns It, safe to name a file with.
 */
const safeFileName = (text: string): string =>
  text
    .replace(/:\s*/g, ' - ')
    .replace(/[<>"/\\|?*\p{Cc}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');

export { safeFileName };
