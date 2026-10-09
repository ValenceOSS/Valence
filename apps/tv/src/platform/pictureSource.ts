import type { ImageSource } from 'expo-image';

/**
 * Says where a picture is and, where there are any, the headers that sign the request for it.
 *
 * A browser signs it with its cookie and has none to add. Handing a picture an empty set of headers
 * anyway makes expo-image fetch it itself and keep it as a blob: fetched again every time the card
 * draws, before the picture can show, and never let go, where an ordinary image would be cached and
 * drawn by the browser.
 *
 * @param uri - Where the picture is.
 * @param headers - What signs the request for it, which may be nothing.
 * @returns What to hand the picture.
 */
const pictureSource = (uri: string, headers: Record<string, string>): ImageSource =>
  Object.keys(headers).length === 0 ? { uri } : { uri, headers };

export { pictureSource };
