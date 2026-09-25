import { say } from '@ValenceI18n/say';

type NamedItem = {
  title: string;
  seriesTitle: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  year: number | null;
};

/**
 * Names one thing in a library the way a person would say it — an episode by its place in its
 * series, anything else by its title and year.
 *
 * @param item - What arrived, left, or is being watched.
 * @returns The name to say.
 */
const nameOfItem = (item: NamedItem): string => {
  if (item.seriesTitle !== null && item.seasonNumber !== null && item.episodeNumber !== null) {
    const season = item.seasonNumber.toString().padStart(2, '0');
    const episode = item.episodeNumber.toString().padStart(2, '0');

    return say('server.webhook.episodeName', {
      series: item.seriesTitle,
      season,
      episode,
      title: item.title,
    });
  }

  return item.year === null ? item.title : `${item.title} (${item.year.toString()})`;
};

export type { NamedItem };

export { nameOfItem };
