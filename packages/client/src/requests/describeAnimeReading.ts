import { say } from '@ValenceI18n/say';
import { describeEpisodeRun } from '@ValenceClient/requests/describeEpisodeRun';
import type { AnimeNumbering, AnimeQuestionReading } from '@ValenceContracts/schemas/Anime';

const NUMBERING_NAMES: Readonly<Record<AnimeNumbering, string>> = {
  aired: say('client.requests.describeAnimeReading.theCataloguesNumbering'),
  perCour: say('client.requests.describeAnimeReading.numberedWithinEachCour'),
  absolute: say('client.requests.describeAnimeReading.numberedFromTheFirst'),
};

/**
 * One way an anime release could be read: the episodes it would hold, by the catalogue's season and
 * episode, and the way of numbering that reads it so.
 *
 * @param reading - The way it could be read.
 * @returns It in words.
 */
const describeAnimeReading = (reading: AnimeQuestionReading): string =>
  say('client.requests.describeAnimeReading.episodesNumbered', {
    episodes: describeEpisodeRun(reading.episodes),
    numbering: NUMBERING_NAMES[reading.numbering],
  });

export { describeAnimeReading };
