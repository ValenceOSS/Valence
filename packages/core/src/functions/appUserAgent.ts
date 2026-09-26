/**
 * What one of Valence's own apps calls itself in the user agent it sends, so the list of devices
 * signed in names it rather than printing the networking library's line underneath it.
 *
 * Only the printable ASCII of the name is kept, since a header carries nothing else and a name such
 * as "Dan’s iPhone" would otherwise stop the request from being sent at all.
 *
 * @param device - What the app calls the device it is on, such as "Dan's iPhone" or "Living Room".
 * @returns Such as `Valence (Dan's iPhone)`.
 */
const appUserAgent = (device: string): string => {
  const printable = device
    .replaceAll('’', "'")
    .replaceAll(/[^\x20-\x7E]/gu, '')
    .replaceAll(/[()]/gu, '')
    .trim();

  return `Valence (${printable === '' ? 'Valence app' : printable})`;
};

export { appUserAgent };
