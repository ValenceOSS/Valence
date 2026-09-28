import { isImageSubtitle } from './isImageSubtitle';
import { readLanguage } from './describeTrack';

type ForcedCandidate = {
  format: string;
  language?: string | null | undefined;
  isForced: boolean;
};

/**
 * The subtitle to show a viewer who has asked for none, which is almost always nothing at all.
 *
 * Subtitles are off until somebody wants them. Putting them on unasked is a decision about how a
 * film is watched, and it is not the server's to make.
 *
 * The one exception is a forced track, which is not a subtitle in the ordinary sense: it carries the
 * parts of a film nobody is meant to miss — an alien language, a sign, a line in a tongue the
 * viewer's own dub does not cover — and it is meant to be on.
 *
 * It only counts where it belongs to the sound being heard. A forced track is made for the dub it
 * ships beside: a release carrying Italian audio and English audio also carries a forced Italian
 * track, for the Italian viewer who needs the English signage translated. Chosen for somebody
 * listening in English, it is not a subtitle, it is the wrong language across the bottom of the
 * picture. A track whose language is unknown is not assumed to match, because the cost of being
 * wrong is subtitles nobody asked for and the cost of being careful is a viewer turning them on.
 *
 * Where several qualify, text wins over pictures. Pictures can only be drawn into the frames, which
 * costs an encode, cannot be turned off without restarting, and leaves a viewer no say in how they
 * look — so a file carrying both a forced `srt` and a forced `pgs` should be showing the `srt`.
 *
 * @param streams - The subtitle streams the file carries.
 * @param spokenLanguage - The language of the audio being heard, where it is known.
 * @returns The track to turn on, or nothing, which is the usual answer.
 */
const selectForcedSubtitle = <TStream extends ForcedCandidate>(
  streams: readonly TStream[],
  spokenLanguage?: string | null,
): TStream | undefined => {
  const spoken = readLanguage(spokenLanguage);

  if (spoken === null) {
    return undefined;
  }

  const forced = streams.filter(
    (stream) => stream.isForced && readLanguage(stream.language) === spoken,
  );

  return forced.find((stream) => !isImageSubtitle(stream.format)) ?? forced[0];
};

export type { ForcedCandidate };

export { selectForcedSubtitle };
