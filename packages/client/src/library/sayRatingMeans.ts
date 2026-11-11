import { say } from '@ValenceI18n/say';

const MEANINGS: Readonly<Record<string, Readonly<Record<string, Parameters<typeof say>[0]>>>> = {
  GB: {
    U: 'client.library.sayRatingMeans.allAges',
    PG: 'client.library.sayRatingMeans.parentalGuidance',
    '12A': 'client.library.sayRatingMeans.twelveWithAnAdult',
    '12': 'client.library.sayRatingMeans.twelveAndUp',
    '15': 'client.library.sayRatingMeans.fifteenAndUp',
    '18': 'client.library.sayRatingMeans.adultsOnly',
    R18: 'client.library.sayRatingMeans.adultsOnly',
  },
  US: {
    G: 'client.library.sayRatingMeans.allAges',
    PG: 'client.library.sayRatingMeans.parentalGuidance',
    'PG-13': 'client.library.sayRatingMeans.thirteenAndUp',
    R: 'client.library.sayRatingMeans.underSeventeenWithAnAdult',
    'NC-17': 'client.library.sayRatingMeans.seventeenAndUp',
    'TV-Y': 'client.library.sayRatingMeans.youngChildren',
    'TV-Y7': 'client.library.sayRatingMeans.sevenAndUp',
    'TV-G': 'client.library.sayRatingMeans.allAges',
    'TV-PG': 'client.library.sayRatingMeans.parentalGuidance',
    'TV-14': 'client.library.sayRatingMeans.fourteenAndUp',
    'TV-MA': 'client.library.sayRatingMeans.adultsOnly',
  },
};

/**
 * Says in a few words what an age rating means, for the UK's and the US's ratings, so a badge with
 * no warnings beside it still tells somebody who it is for.
 *
 * @param region - The country the rating is from, as a two-letter code.
 * @param certification - The rating, as that country writes it.
 * @returns What it means, or null for a rating from elsewhere.
 */
const sayRatingMeans = (region: string | null, certification: string | null): string | null => {
  const handler =
    region === null || certification === null
      ? undefined
      : MEANINGS[region.toUpperCase()]?.[certification.trim().toUpperCase()];

  return handler === undefined ? null : say(handler);
};

export { sayRatingMeans };
