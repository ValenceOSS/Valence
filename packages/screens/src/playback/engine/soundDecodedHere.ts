import type { InputAudioTrack } from 'mediabunny';

const TRUEHD_IDS: readonly (string | number | Uint8Array | null)[] = ['A_TRUEHD', 'mlpa'];

/**
 * Which of Valence's own decoders a sound track needs, where Mediabunny has none for it — TrueHD,
 * recognised by the codec its container names, since Mediabunny does not know the codec at all.
 *
 * @param track - The sound track.
 * @returns The decoder it needs, or nothing where Mediabunny decodes it.
 */
const soundDecodedHere = async (
  track: Pick<InputAudioTrack, 'getInternalCodecId'>,
): Promise<'truehd' | null> =>
  TRUEHD_IDS.includes(await track.getInternalCodecId()) ? 'truehd' : null;

export { soundDecodedHere };
