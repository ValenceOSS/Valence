import { z } from 'zod';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';

const SubtitleSpanSchema = z.object({
  text: z.string(),
  fontFamily: z.string().nullable(),
  fontHeight: z.number().nullable(),
  colour: z.string().nullable(),
  opacity: z.number().nullable(),
  isBold: z.boolean(),
  isItalic: z.boolean(),
  isUnderlined: z.boolean(),
  isStruckThrough: z.boolean(),
});

const NOT_FOUND = 404;

const SubtitleCueSchema = z.object({
  from: z.number(),
  to: z.number(),
  spans: z.array(SubtitleSpanSchema),
  alignment: z.number().int().min(1).max(9),
  position: z.object({ x: z.number(), y: z.number() }).nullable(),
  margins: z.object({ left: z.number(), right: z.number(), vertical: z.number() }),
  isSign: z.boolean(),
});

const SubtitleCuesSchema = z.object({ cues: z.array(SubtitleCueSchema) });

type SubtitleSpan = z.infer<typeof SubtitleSpanSchema>;

type SubtitleCue = z.infer<typeof SubtitleCueSchema>;

/**
 * Builds the address a track's styled lines are served from.
 *
 * @param mediaId - The item being played.
 * @param trackId - Which track.
 * @param fromSeconds - Where to begin the track, for a stream that starts part-way in.
 * @returns The address to ask.
 */
const subtitleCuesUrl = (mediaId: string, trackId: string, fromSeconds = 0): string =>
  `/api/media/${mediaId}/subtitles/${trackId}/cues?from=${Math.max(0, Math.floor(fromSeconds)).toString()}`;

/**
 * Reads a track as lines that kept where they go and what they were dressed in.
 *
 * Only a script carries any of that. A track with none answers that it has none, and so does a
 * script with no line in it, or an answer that is not the shape asked for; each is read as WebVTT
 * instead, which is also what happens on a server too old to have been asked this. Anything else —
 * a server out of reach, or one that could not read the track just now — is thrown, so whoever
 * asked can ask again rather than settle for nothing.
 *
 * @param url - The address the lines are served from.
 * @param signal - Told when the lines are no longer wanted.
 * @returns The lines, or null where this track has no styled form.
 */
const fetchSubtitleCues = async (
  url: string,
  signal?: AbortSignal,
): Promise<SubtitleCue[] | null> => {
  const answer = await fetch(url, signal === undefined ? {} : { signal });

  if (answer.status === NOT_FOUND) {
    return null;
  }

  if (!answer.ok) {
    throw new RequestFailed(url, answer.status);
  }

  const read = SubtitleCuesSchema.safeParse(await answer.json().catch(() => null));

  return read.success && read.data.cues.length > 0 ? read.data.cues : null;
};

export type { SubtitleCue, SubtitleSpan };

export { fetchSubtitleCues, subtitleCuesUrl };
