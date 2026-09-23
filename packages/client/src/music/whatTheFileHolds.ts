import type { MusicTrack } from '@ValenceContracts/schemas/Music';

/**
 * What a song's file holds, said the way a listener checks it: the format, how fine each sample is
 * and how often they are taken, and how much a second of it carries — whichever of those the file
 * says.
 *
 * @param track - The song.
 * @returns The line, such as "FLAC · 24-bit / 96 kHz · 2,304 kbps".
 */
const whatTheFileHolds = (
  track: Pick<MusicTrack, 'codec' | 'bitDepth' | 'sampleRate' | 'bitrateKbps'>,
): string => {
  const depth = track.bitDepth === null ? null : `${track.bitDepth.toString()}-bit`;
  const rate =
    track.sampleRate === null
      ? null
      : `${(track.sampleRate / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })} kHz`;
  const fineness = [depth, rate].filter((part) => part !== null).join(' / ');

  return [
    track.codec.toUpperCase(),
    fineness === '' ? null : fineness,
    track.bitrateKbps === null ? null : `${track.bitrateKbps.toLocaleString('en-GB')} kbps`,
  ]
    .filter((part) => part !== null)
    .join(' · ');
};

export { whatTheFileHolds };
