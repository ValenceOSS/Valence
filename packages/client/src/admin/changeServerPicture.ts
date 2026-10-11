import { LinkIdentitySchema } from '@ValenceContracts/schemas/LinkedServer';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import type { LinkIdentity } from '@ValenceContracts/schemas/LinkedServer';
import { say } from '@ValenceI18n/say';

/**
 * Gives this server a picture for linked servers to show it by, or takes it away.
 *
 * @param file - The picture, or null to take it away.
 * @returns This server as it now stands, or why the picture was refused.
 */
const changeServerPicture = async (
  file: File | null,
): Promise<{ identity: LinkIdentity | null; refusal: string | null }> => {
  const response = await fetch('/api/linked-servers/identity/picture', {
    method: file === null ? 'DELETE' : 'PUT',
    credentials: 'same-origin',
    ...(file === null ? {} : { headers: { 'content-type': file.type }, body: file }),
  }).catch(() => null);

  if (response === null) {
    return { identity: null, refusal: say('common.thatPictureCouldNotBeSent') };
  }

  const body = await response.json().catch(() => null);

  if (response.ok) {
    const read = LinkIdentitySchema.safeParse(body);

    return read.success
      ? { identity: read.data, refusal: null }
      : { identity: null, refusal: say('common.thatPictureCouldNotBeUsed') };
  }

  const said = RefusalSchema.safeParse(body);

  return {
    identity: null,
    refusal: said.success ? said.data.error : say('common.thatPictureCouldNotBeUsed'),
  };
};

export { changeServerPicture };
