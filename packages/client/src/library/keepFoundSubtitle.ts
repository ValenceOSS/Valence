import { fetchFoundSubtitle } from '@ValenceClient/library/fetchFoundSubtitle';
import { fetchSubtitleTracks } from '@ValenceClient/playback/fetchSubtitles';
import { languageName } from '@ValenceClient/playback/languageName';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { SubtitleChoice } from '@ValenceContracts/schemas/SubtitleFinding';

type Kept =
  | { kind: 'kept'; tracks: SubtitleTrack[]; fresh: SubtitleTrack | null }
  | { kind: 'refused'; problem: string };

/**
 * Has the server fetch a subtitle found on a subtitle site and keep it beside the video, then reads
 * the title's tracks again and picks out the new one in the language asked for, so a player can
 * switch it on without starting again. Where nothing new shows up in it, as when the same file was
 * kept once already, the first track in that language stands in for it. Where the player has not read the
 * tracks yet, they are read before the subtitle is kept, so an old one is never taken for it.
 *
 * @param mediaId - The film or episode.
 * @param choice - The subtitle chosen, and the language it was looked for in.
 * @param known - The tracks the title had until now, or nothing where they are not read yet.
 * @returns The title's tracks and the one fetched, or why it could not be kept.
 */
const keepFoundSubtitle = async (
  mediaId: string,
  choice: SubtitleChoice,
  known: readonly SubtitleTrack[] | null,
): Promise<Kept> => {
  const before = known ?? (await fetchSubtitleTracks(mediaId));
  const saved = await fetchFoundSubtitle(mediaId, choice);

  if ('problem' in saved) {
    return { kind: 'refused', problem: saved.problem };
  }

  const held = new Set(before.map((track) => track.id));
  const named = languageName(choice.language).toLowerCase();
  const tracks = await fetchSubtitleTracks(mediaId);
  const isInTheLanguage = (track: SubtitleTrack) =>
    languageName(track.language ?? '').toLowerCase() === named;
  const fresh =
    tracks.find((track) => !held.has(track.id) && isInTheLanguage(track)) ??
    tracks.find(isInTheLanguage) ??
    tracks.find((track) => !held.has(track.id)) ??
    null;

  return { kind: 'kept', tracks, fresh };
};

export type { Kept };

export { keepFoundSubtitle };
