import { LiveSourceSchema } from '@ValenceContracts/schemas/LiveTv';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import type { LiveSource } from '@ValenceContracts/schemas/LiveTv';
import { say } from '@ValenceI18n/say';

/**
 * Gives a single stream or embedded page a picture to show as its channel's logo, or takes it away.
 *
 * @param sourceId - The source.
 * @param file - The picture, or null to take it away.
 * @returns The source as it now stands, or why the picture was refused.
 */
const changeLiveSourcePicture = async (
  sourceId: string,
  file: File | null,
): Promise<{ source: LiveSource | null; refusal: string | null }> => {
  const response = await fetch(`/api/live/sources/${encodeURIComponent(sourceId)}/picture`, {
    method: file === null ? 'DELETE' : 'PUT',
    credentials: 'same-origin',
    ...(file === null ? {} : { headers: { 'content-type': file.type }, body: file }),
  }).catch(() => null);

  if (response === null) {
    return { source: null, refusal: say('common.thatPictureCouldNotBeSent') };
  }

  const body = await response.json().catch(() => null);

  if (response.ok) {
    const read = LiveSourceSchema.safeParse(body);

    return read.success
      ? { source: read.data, refusal: null }
      : { source: null, refusal: say('common.thatPictureCouldNotBeUsed') };
  }

  const said = RefusalSchema.safeParse(body);

  return {
    source: null,
    refusal: said.success ? said.data.error : say('common.thatPictureCouldNotBeUsed'),
  };
};

export { changeLiveSourcePicture };
