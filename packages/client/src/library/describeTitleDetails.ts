import { formatCalendarDate } from '@ValenceCore/functions/formatCalendarDate';
import { formatMoney } from '@ValenceCore/functions/formatMoney';

/**
 * Whether a title is an episode, which is whether it belongs to a series.
 *
 * @param seriesTitle - The series it belongs to, where it does.
 * @returns Whether it is one.
 */
const isAnEpisode = (seriesTitle: string | null | undefined): boolean =>
  seriesTitle !== undefined && seriesTitle !== null && seriesTitle !== '';

/**
 * The facts about a title worth a line each — when it came out, how it stands, what it cost and made,
 * what the critics thought — leaving out whichever the catalogue does not know.
 *
 * An episode aired rather than was released, and how its programme stands is not a fact about it,
 * so an episode says when it aired and nothing of the programme's status.
 *
 * @param metadata - What the catalogue says about it, and the series it belongs to where it is an
 *   episode.
 * @returns A label and a value for each fact known.
 */
const describeTitleDetails = ({
  seriesTitle,
  releaseDate,
  status,
  budget,
  revenue,
  rottenTomatoes,
}: {
  seriesTitle?: string | null | undefined;
  releaseDate?: string | null | undefined;
  status?: string | null | undefined;
  budget?: number | null | undefined;
  revenue?: number | null | undefined;
  rottenTomatoes?: number | null | undefined;
}): { label: string; value: string }[] => [
  ...(releaseDate === undefined || releaseDate === null || releaseDate === ''
    ? []
    : [
        {
          label: isAnEpisode(seriesTitle) ? 'Aired' : 'Released',
          value: formatCalendarDate(releaseDate),
        },
      ]),
  ...(status === undefined || status === null || status === '' || isAnEpisode(seriesTitle)
    ? []
    : [{ label: 'Status', value: status }]),
  ...(budget === undefined || budget === null || budget <= 0
    ? []
    : [{ label: 'Budget', value: formatMoney(budget) }]),
  ...(revenue === undefined || revenue === null || revenue <= 0
    ? []
    : [{ label: 'Box office', value: formatMoney(revenue) }]),
  ...(rottenTomatoes === undefined || rottenTomatoes === null
    ? []
    : [{ label: 'Rotten Tomatoes', value: `${rottenTomatoes.toString()}%` }]),
];

export { describeTitleDetails };
