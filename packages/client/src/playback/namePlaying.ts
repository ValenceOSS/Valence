import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { say } from '@ValenceI18n/say';

type Playing = {
  title: string;
  seriesTitle?: string | null | undefined;
  seasonNumber?: number | null | undefined;
  episodeNumber?: number | null | undefined;
  episodeNumberEnd?: number | null | undefined;
  year?: number | null | undefined;
  releaseDate?: string | null | undefined;
};

/**
 * Names what is playing, in the order somebody looking for it would say it — the programme, where in
 * it this is, and what this one is called — and says when it is from, apart from the name so each
 * player can set it as it likes.
 *
 * An episode named by its own title alone is unidentifiable — half the television ever made has an
 * episode called Pilot — and a programme named without the episode is no better. Both are said,
 * separated rather than run together, so the eye can stop at whichever part it was looking for.
 *
 * An episode is from the year it was shown, not the year its programme began. The catalogue files an
 * episode's `year` under the programme's first airing, so the seventh season of something that began
 * in 2008 would otherwise be dated 2008; its own air date says when it is from, and the programme's
 * year is kept only for an episode that has none. Anything missing is left out rather than drawn as a
 * gap: a film has no series and an unmatched item may have no year.
 *
 * @param media - What is playing.
 * @returns What to call it, and the year it is from where that is known.
 */
const namePlaying = (media: Playing): { name: string; year: number | null } => {
  const series = media.seriesTitle ?? null;
  const aired = Number(media.releaseDate?.slice(0, 4));
  const year =
    series !== null && Number.isInteger(aired) && aired > 0 ? aired : (media.year ?? null);

  if (series === null) {
    return { name: media.title, year };
  }

  const season = media.seasonNumber ?? null;
  const episode = media.episodeNumber ?? null;

  const where =
    season === null || episode === null
      ? null
      : say('common.searchWhatEpisode', {
          season: season.toString(),
          episode: describeEpisodeNumbers(episode, media.episodeNumberEnd),
        });

  return {
    name: [series, where, media.title].filter((part) => part !== null).join(' · '),
    year,
  };
};

export type { Playing };

export { namePlaying };
