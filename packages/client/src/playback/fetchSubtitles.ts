import { readFromServer } from '@ValenceClient/query/readFromServer';
import { z } from 'zod';
import { readLanguage } from '@ValenceCore/functions/describeTrack';
import { selectForcedSubtitle } from '@ValenceCore/functions/selectForcedSubtitle';

const SubtitleTrackSchema = z.object({
  id: z.string(),
  language: z.string().nullable(),
  label: z.string(),
  format: z.string(),
  isForced: z.boolean(),
  isHearingImpaired: z.boolean(),
  delivery: z.enum(['text', 'burnIn']).default('text'),
  streamIndex: z.number().int().nullable().default(null),
});

const SubtitleListSchema = z.object({ tracks: z.array(SubtitleTrackSchema) });

type SubtitleTrack = z.infer<typeof SubtitleTrackSchema>;

const SUBTITLES_OFF = 'off';

/**
 * Reads the subtitle tracks available for an item, from inside the container and from the files
 * beside it, presented as one list.
 *
 * @param mediaId - The item being played.
 * @returns The tracks to offer, or none where the request failed.
 */
const fetchSubtitleTracks = async (mediaId: string): Promise<SubtitleTrack[]> => {
  return (await readFromServer(`/api/media/${mediaId}/subtitles`, SubtitleListSchema)).tracks;
};

/**
 * Builds the address a subtitle track is served from, converted to the one format a browser takes.
 *
 * @param mediaId - The item being played.
 * @param trackId - Which track.
 * @param fromSeconds - Where to begin the track, for a preview that starts part-way in.
 * Built onto the server this client watches, because a video element resolves what it is given
 * against the page it is on — and a client serving its own pages would ask itself for subtitles.
 *
 * @returns The address to attach to the video element.
 */
const subtitleTrackUrl = (mediaId: string, trackId: string, fromSeconds = 0): string =>
  `/api/media/${mediaId}/subtitles/${trackId}?from=${Math.max(0, Math.floor(fromSeconds)).toString()}`;

/**
 * Picks the track to show before anybody has chosen — a forced track in the language being heard,
 * since forced subtitles carry the parts of a film nobody is meant to miss, and otherwise nothing.
 *
 * The language matters because a forced track belongs to the dub it was made for: a release carrying
 * Italian audio and English audio also carries a forced Italian track, for the Italian viewer who
 * needs the English signage translated. Chosen for a viewer listening in English it is not a
 * subtitle, it is the wrong language across the bottom of the picture. Measured on a real file whose
 * only forced track was Italian while the audio selected was English.
 *
 * Where a forced track comes as both text and pictures the text one is shown, the same answer the
 * server gives when it plans the stream. See `selectForcedSubtitle`.
 *
 * @param tracks - The tracks available.
 * @param spokenLanguage - The language of the audio being played, where it is known.
 * @returns The track to start with, or the identifier meaning none.
 */
const defaultTrackId = (tracks: SubtitleTrack[], spokenLanguage?: string | null): string =>
  selectForcedSubtitle(tracks, spokenLanguage)?.id ?? SUBTITLES_OFF;

/**
 * Finds the track that continues what a viewer was already reading, when playback moves to the next
 * film or episode — subtitles chosen once should not have to be chosen again every time.
 *
 * Only a text track carries on. A track of pictures has to be drawn into the video, which restarts
 * the stream and holds it to an encode for as long as it is on — a cost somebody pays by choosing
 * that track, not one a remembered language should spend on their behalf. A remux usually lists its
 * pictures first, so taking the first track in the language turned them on for every film. A full
 * track is preferred over a forced one, since the viewer was reading everything, not just the signs.
 *
 * @param tracks - The tracks available on the new item.
 * @param language - The language they were reading.
 * @returns The track to select, or null where this item has no text track in that language.
 */
const trackForLanguage = (
  tracks: SubtitleTrack[],
  language: string | null,
): SubtitleTrack | null => {
  const wanted = readLanguage(language);

  if (wanted === null) {
    return null;
  }

  const readable = tracks.filter(
    (track) => track.delivery === 'text' && readLanguage(track.language) === wanted,
  );

  return readable.find((track) => !track.isForced) ?? readable[0] ?? null;
};

export type { SubtitleTrack };

export { fetchSubtitleTracks, subtitleTrackUrl, defaultTrackId, trackForLanguage, SUBTITLES_OFF };
