import { say } from '@ValenceI18n/say';

/**
 * A run of episodes by the catalogue's season and episode: one, such as S01E13, or the first and
 * last of several.
 *
 * @param places - The episodes, in order.
 * @returns Them in words, or nothing where there are none.
 */
const describeEpisodeRun = (places: readonly { season: number; episode: number }[]): string => {
  const codeOf = (place: { season: number; episode: number }) =>
    say('common.searchWhatEpisode', {
      season: place.season.toString().padStart(2, '0'),
      episode: place.episode.toString().padStart(2, '0'),
    });
  const [first] = places;
  const last = places.at(-1);

  if (first === undefined || last === undefined) {
    return '';
  }

  return places.length === 1
    ? codeOf(first)
    : say('client.requests.describeAnimeReading.fromTo', {
        first: codeOf(first),
        last: codeOf(last),
      });
};

export { describeEpisodeRun };
