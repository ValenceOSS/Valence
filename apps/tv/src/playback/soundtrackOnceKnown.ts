import { NOTHING_ASKED } from '@ValenceClient/playback/NOTHING_ASKED';
import { soundtrackAsked } from '@ValenceClient/playback/soundtrackAsked';
import type { SoundtrackAsked } from '@ValenceClient/playback/soundtrackAsked';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

/**
 * What the television asks to hear, once it knows enough to say: nothing where it remembers no
 * language, and otherwise the language or the track in it once both the title's soundtracks and
 * whether the server picks a track by language are known.
 *
 * @param remembered - The language to hear, or nothing.
 * @param streams - The title's soundtracks, nothing where the title could not be read, or
 *   undefined while it is still being read.
 * @param hearsLanguages - Whether the server picks a track by language, false where it could not
 *   say, or nothing until it has answered.
 * @returns What to ask for, or nothing until that can be known.
 */
const soundtrackOnceKnown = (
  remembered: string | null,
  streams: readonly AudioStream[] | null | undefined,
  hearsLanguages: boolean | null,
): SoundtrackAsked | null =>
  remembered === null
    ? NOTHING_ASKED
    : streams === undefined || hearsLanguages === null
      ? null
      : soundtrackAsked(remembered, streams ?? [], hearsLanguages);

export { soundtrackOnceKnown };
