type AudioTrackWanted = {
  language?: string;
  codec?: string;
  isAtmos?: true;
  channels?: number;
};

/**
 * Turns the audio somebody filtered a library by into the tracks an item must hold one of. Each
 * track wanted names every kind of choice made, so asking for Japanese in 5.1 finds a Japanese 5.1
 * track rather than any item with a Japanese track and, separately, a 5.1 one. Atmos is a quality of
 * a track rather than a codec of its own, so choosing it asks for that rather than a codec.
 *
 * @param audio - The languages, codecs and channel counts chosen, any of which may be empty.
 * @returns The tracks to look for, any one of which will do, or none where nothing was chosen.
 */
const audioTracksWanted = (audio: {
  languages: readonly string[];
  codecs: readonly string[];
  channels: readonly number[];
}): AudioTrackWanted[] => {
  if (audio.languages.length === 0 && audio.codecs.length === 0 && audio.channels.length === 0) {
    return [];
  }

  const languages: AudioTrackWanted[] =
    audio.languages.length === 0 ? [{}] : audio.languages.map((language) => ({ language }));
  const codecs: AudioTrackWanted[] =
    audio.codecs.length === 0
      ? [{}]
      : audio.codecs.map((codec) => (codec === 'atmos' ? { isAtmos: true } : { codec }));
  const channels: AudioTrackWanted[] =
    audio.channels.length === 0 ? [{}] : audio.channels.map((count) => ({ channels: count }));

  return languages.flatMap((language) =>
    codecs.flatMap((codec) => channels.map((channel) => ({ ...language, ...codec, ...channel }))),
  );
};

export type { AudioTrackWanted };

export { audioTracksWanted };
