/**
 * Where a server's picture is read from: this server's own, or this server's copy of a linked
 * server's, addressed by when it last changed so a new picture is never mistaken for the old one.
 *
 * @param serverId - The linked server, or null for this one.
 * @param pictureAt - When its picture last changed, or null where it has none.
 * @returns The address, or null where there is no picture.
 */
const serverPictureUrl = (serverId: string | null, pictureAt: string | null): string | null =>
  pictureAt === null
    ? null
    : `/api/linked-servers/${serverId === null ? 'identity' : encodeURIComponent(serverId)}/picture?v=${encodeURIComponent(pictureAt)}`;

export { serverPictureUrl };
