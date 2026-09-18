import { selectAudioStream } from '@ValenceCore/functions/describeTrack';
import type { PreviewMoment } from '@ValenceContracts/schemas/Library';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import type { PreviewQuality } from '@ValenceContracts/schemas/PreviewQuality';

type PreviewSubject = {
  path: string;
  audioStreams: AudioStream[];
  previewMoment?: PreviewMoment | null;
};

/**
 * Builds the request that names an item's hover preview, which is also what identifies it in the
 * cache — the same item asked for twice must produce the same request, or the second ask renders a
 * second copy of a clip that already exists. A moment somebody chose is part of that request for
 * the same reason in reverse: a clip cut from one place must not answer for a request asking for
 * another.
 *
 * @param subject - The item being previewed, with the streams a clip is cut from and the moment
 *   somebody chose for it, where one was.
 * @param generation - Which round of previews this is, so that a change of recipe produces a
 *   different request rather than matching the clip already cached.
 * @param defaultAudioLanguage - The language the library prefers, which decides the audio track.
 * @param quality - The preset the server renders previews at, which is part of the clip's address
 *   too, so a clip made at one preset never answers for another.
 * @returns The request to hand the media service.
 */
const previewRequestFor = (
  subject: PreviewSubject,
  generation: number,
  defaultAudioLanguage: string | null,
  quality: PreviewQuality,
): {
  inputPath: string;
  generation: number;
  quality: PreviewQuality;
  audioStreamIndex?: number;
  atSeconds?: number;
  durationSeconds?: number;
} => {
  const audioStreamIndex =
    defaultAudioLanguage === null
      ? undefined
      : selectAudioStream(subject.audioStreams, defaultAudioLanguage)?.index;
  const moment = subject.previewMoment ?? null;

  return {
    inputPath: subject.path,
    generation,
    quality,
    ...(audioStreamIndex === undefined ? {} : { audioStreamIndex }),
    ...(moment === null ? {} : { atSeconds: moment.atSeconds }),
    ...(moment?.durationSeconds === null || moment?.durationSeconds === undefined
      ? {}
      : { durationSeconds: moment.durationSeconds }),
  };
};

export { previewRequestFor };
