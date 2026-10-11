import type { InputVideoTrack } from 'mediabunny';

const MPEG2_IDS: readonly (string | number | Uint8Array | null)[] = ['V_MPEG2', 2];

/**
 * Whether a picture is MPEG-2, which Mediabunny does not know as a codec and no browser decodes,
 * recognised by what its container calls it: Matroska's `V_MPEG2`, or stream type 2 in a
 * transport stream.
 *
 * @param track - The picture.
 * @returns Whether it is MPEG-2.
 */
const isMpeg2Track = async (
  track: Pick<InputVideoTrack, 'codec' | 'getInternalCodecId'>,
): Promise<boolean> => track.codec === null && MPEG2_IDS.includes(await track.getInternalCodecId());

export { isMpeg2Track };
