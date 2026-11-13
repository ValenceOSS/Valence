/**
 * The address of the square of a face its frame chose, which the server makes from the upload, in
 * place of the whole picture an app would otherwise have to frame itself.
 *
 * @param address - Where the whole picture is served from.
 * @returns Where the framed square is.
 */
const framedPictureUrl = (address: string): string =>
  `${address}${address.includes('?') ? '&' : '?'}framed=1`;

export { framedPictureUrl };
