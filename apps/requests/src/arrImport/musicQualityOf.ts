import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';

const NAMED: Readonly<Record<string, MusicQuality>> = {
  'flac 24bit': 'flac24',
  flac: 'flac',
  alac: 'alac',
  'alac 24bit': 'alac',
  'mp3-320': 'mp3-320',
  'mp3-vbr-v0': 'mp3-v0',
  'mp3-256': 'mp3-256',
  'mp3-vbr-v2': 'mp3-v2',
};

/**
 * Which of Valence's music qualities a quality Lidarr names is, such as `FLAC 24bit` or
 * `MP3-VBR-V0`, with every lesser MP3 as plain MP3; one Valence has no equivalent for, such as `WAV`
 * or `OGG Vorbis Q9`, is none.
 *
 * @param name - The quality's name.
 * @returns The quality, or null.
 */
const musicQualityOf = (name: string): MusicQuality | null => {
  const tidy = name.trim().toLowerCase();

  if (NAMED[tidy] !== undefined) {
    return NAMED[tidy];
  }

  if (tidy.startsWith('mp3')) {
    return 'mp3';
  }

  if (tidy.startsWith('aac')) {
    return 'aac';
  }

  return tidy.startsWith('opus') ? 'opus' : null;
};

export { musicQualityOf };
