import { InviteContentsSchema, LINK_INVITE_PREFIX } from '@ValenceContracts/schemas/LinkedServer';
import type { InviteContents } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Reads an invite another server's admin pasted, refusing anything that is not one.
 *
 * @param invite - The invite, as it was pasted.
 * @returns What it carries, or nothing where it is not an invite.
 */
const readLinkInvite = (invite: string): InviteContents | null => {
  const trimmed = invite.trim();

  if (!trimmed.startsWith(LINK_INVITE_PREFIX)) {
    return null;
  }

  try {
    const read = InviteContentsSchema.safeParse(
      JSON.parse(
        Buffer.from(trimmed.slice(LINK_INVITE_PREFIX.length), 'base64url').toString('utf8'),
      ),
    );

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

export { readLinkInvite };
