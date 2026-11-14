/**
 * Where one of a Jellyfin item's pictures is fetched, which needs no sign-in. Valence's apps add a
 * width to it as `&maxWidth=`, since it already carries a query.
 *
 * @param address - The Jellyfin server.
 * @param itemId - The item whose picture it is.
 * @param type - Which of its pictures, as Jellyfin names them.
 * @param tag - The picture's tag, which changes when the picture does.
 * @returns The address.
 */
const jellyfinPictureAddress = (
  address: string,
  itemId: string,
  type: string,
  tag: string,
): string => `${address}/Items/${itemId}/Images/${type}?tag=${encodeURIComponent(tag)}&quality=90`;

export { jellyfinPictureAddress };
