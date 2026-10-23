import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

/**
 * Finds the soundtrack to ask for in a language somebody chose, where the file's own default is not
 * already it, so asking for nothing still plays what they wanted.
 *
 * @param streams - The file's soundtracks.
 * @param language - The language chosen.
 * @returns The soundtrack's stream, or nothing where the default will do or none is in that language.
 */
const audioStreamIn = (streams: readonly AudioStream[], language: string): number | undefined => {
  const heard = streams.find((stream) => stream.language === language);

  return heard === undefined || heard.isDefault ? undefined : heard.index;
};

export { audioStreamIn };
