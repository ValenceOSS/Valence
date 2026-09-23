import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const LOSSLESS_TOPS_OUT_AT = 48_000;

/**
 * What a song's file is worth saying about, as a badge beside the song playing, in the words Apple
 * Music uses: lossless up to 24-bit at 48 kHz, and hi-res lossless only above 48 kHz — the bit
 * depth alone does not make a file hi-res. A lossy file, or a lossless one being sent smaller than
 * it is, says nothing, since the badge is about what is heard.
 *
 * @param track - The song.
 * @param isSentWhole - Whether the file is being played as it is rather than at a smaller quality.
 * @returns The badge, or null for none.
 */
const howTheFileSounds = (
  track: Pick<MusicTrack, 'isLossless' | 'sampleRate'>,
  isSentWhole: boolean,
): 'Hi-Res Lossless' | 'Lossless' | null => {
  if (!track.isLossless || !isSentWhole) {
    return null;
  }

  return (track.sampleRate ?? 0) > LOSSLESS_TOPS_OUT_AT ? 'Hi-Res Lossless' : 'Lossless';
};

export { howTheFileSounds };
