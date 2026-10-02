import { LINK_INVITE_PREFIX } from '@ValenceContracts/schemas/LinkedServer';
import type { InviteContents } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Writes an invite for another server's admin to paste: where this server is, the one-time code,
 * and this server's fingerprint, so the other side can tell it reached the server that invited it.
 *
 * @param contents - What the invite carries.
 * @returns The invite, as one string.
 */
const writeLinkInvite = (contents: InviteContents): string =>
  `${LINK_INVITE_PREFIX}${Buffer.from(JSON.stringify(contents)).toString('base64url')}`;

export { writeLinkInvite };
