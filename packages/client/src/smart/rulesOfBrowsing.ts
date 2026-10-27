import type { TitleOrder, TitleRule, TitleRules } from '@ValenceContracts/schemas/SmartRules';
import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';
import type { BrowseOrder } from '@ValenceClient/library/BrowseOrder';

type Browsing = {
  kind: 'films' | 'shows';
  libraryIds: readonly string[] | null;
  asked: {
    genres?: readonly string[];
    decades?: readonly number[];
    minRating?: number;
    minYourStars?: number;
  };
  arrangement: Arrangement;
};

/**
 * The order of a smart collection nearest a page's order, newest first where there is none.
 *
 * @param order - The page's order.
 * @returns The collection's order.
 */
const orderOf = (order: BrowseOrder): TitleOrder => (order === 'size' ? 'added' : order);

/**
 * The rules of a smart collection that holds what a page of films or shows is showing: its genres,
 * decades where they run on from one another, ratings and stars, whether what has been watched is
 * hidden, the libraries it was kept to and its order. What no rule can say, such as sound or
 * decades with a gap between them, is left out.
 *
 * @param browsing - The page, and what it is filtered and ordered by.
 * @returns The rules.
 */
const rulesOfBrowsing = ({ kind, libraryIds, asked, arrangement }: Browsing): TitleRules => {
  const decades = [...(asked.decades ?? [])].sort((left, right) => left - right);
  const runsOn = decades.every((decade, at) => at === 0 || decade - (decades[at - 1] ?? 0) === 10);
  const rules: TitleRule[] = [
    ...(asked.genres === undefined || asked.genres.length === 0
      ? []
      : [{ kind: 'genre' as const, anyOf: [...asked.genres], isNegated: false }]),
    ...(decades.length === 0 || !runsOn
      ? []
      : [
          {
            kind: 'released' as const,
            from: Math.min(...decades),
            to: Math.max(...decades) + 9,
          },
        ]),
    ...(asked.minRating === undefined
      ? []
      : [{ kind: 'rating' as const, atLeast: asked.minRating }]),
    ...(asked.minYourStars === undefined
      ? []
      : [{ kind: 'yourStars' as const, atLeast: asked.minYourStars }]),
    ...(arrangement.isHidingWatched
      ? [{ kind: 'watched' as const, state: 'notFinished' as const }]
      : []),
    ...(libraryIds === null || libraryIds.length === 0
      ? []
      : [{ kind: 'library' as const, anyOf: [...libraryIds] }]),
  ];

  return {
    holds: kind === 'films' ? 'films' : 'series',
    rules,
    order: orderOf(arrangement.order),
    limit: null,
  };
};

export type { Browsing };

export { rulesOfBrowsing };
