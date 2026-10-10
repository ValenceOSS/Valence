import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import { say } from '@ValenceI18n/say';

/**
 * Which episode of a show somebody is watching, by season and number and then its title, where
 * what they are watching is an episode at all.
 *
 * @param session - The open session.
 * @returns The episode, or nothing.
 */
const episodeOfSession = ({ playback }: ActiveSession): string | null =>
  playback === null || playback.seriesTitle === null
    ? null
    : [
        playback.seasonNumber === null || playback.episodeNumber === null
          ? null
          : say('common.searchWhatEpisode', {
              season: playback.seasonNumber.toString(),
              episode: playback.episodeNumber.toString(),
            }),
        playback.mediaTitle,
      ]
        .filter((part) => part !== null)
        .join(' · ');

export { episodeOfSession };
