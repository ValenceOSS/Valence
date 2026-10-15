const UNSAID = new Set(['', 'und', 'unknown', 'zxx', 'mul', 'mis']);

/**
 * Gathers the audio a library's items hold into what can be filtered by: every language a track is
 * tagged with, every codec, with Atmos first where any track carries it, and every channel count,
 * most first. A tag that names no language is left out, since choosing it would ask for nothing.
 *
 * @param tracks - The distinct tracks held, as language, codec, channel count and whether Atmos.
 * @returns The audio facets.
 */
const audioFacetsOf = (
  tracks: readonly {
    language: string | null;
    codec: string | null;
    channels: number | null;
    isAtmos: boolean;
  }[],
): { audioLanguages: string[]; audioCodecs: string[]; audioChannels: number[] } => {
  const languages = new Set<string>();
  const codecs = new Set<string>();
  const channels = new Set<number>();
  let hasAtmos = false;

  for (const track of tracks) {
    if (track.language !== null && !UNSAID.has(track.language.trim().toLowerCase())) {
      languages.add(track.language);
    }

    if (track.codec !== null && track.codec !== '') {
      codecs.add(track.codec);
    }

    if (track.channels !== null && Number.isInteger(track.channels) && track.channels > 0) {
      channels.add(track.channels);
    }

    hasAtmos ||= track.isAtmos;
  }

  return {
    audioLanguages: [...languages].sort((one, other) => one.localeCompare(other)),
    audioCodecs: [
      ...(hasAtmos ? ['atmos'] : []),
      ...[...codecs].sort((one, other) => one.localeCompare(other)),
    ],
    audioChannels: [...channels].sort((one, other) => other - one),
  };
};

export { audioFacetsOf };
