import type {
  CatalogueBrowse,
  CatalogueBrowseKind,
  CatalogueList,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type { StringKey } from '@ValenceI18n/StringKey';
import { say } from '@ValenceI18n/say';

const LIST_WORDS: Record<CatalogueList, Record<CatalogueBrowseKind, StringKey>> = {
  trending: {
    film: 'screens.describeBrowsing.trendingFilms',
    series: 'screens.describeBrowsing.trendingSeries',
  },
  popular: {
    film: 'screens.describeBrowsing.popularFilms',
    series: 'screens.describeBrowsing.popularSeries',
  },
  upcoming: {
    film: 'screens.describeBrowsing.comingFilms',
    series: 'screens.describeBrowsing.comingSeries',
  },
};

const STUDIO_WORDS: Record<CatalogueBrowseKind, { named: StringKey; unnamed: StringKey }> = {
  film: {
    named: 'screens.describeBrowsing.studioFilms',
    unnamed: 'screens.describeBrowsing.unnamedStudioFilms',
  },
  series: {
    named: 'screens.describeBrowsing.studioSeries',
    unnamed: 'screens.describeBrowsing.unnamedStudioSeries',
  },
};

/**
 * What a whole list is called at the top of the page showing it — the studio's name where one was
 * chosen, since a studio's films are its films rather than anybody's idea of popular.
 *
 * @param browsing - Which list, of which kind, and whose studio.
 * @param studioName - What that studio is called, where it is known.
 * @returns The heading.
 */
const describeBrowsing = (browsing: CatalogueBrowse, studioName: string | null = null): string =>
  browsing.studio === null
    ? say(LIST_WORDS[browsing.list][browsing.kind])
    : studioName === null
      ? say(STUDIO_WORDS[browsing.kind].unnamed)
      : say(STUDIO_WORDS[browsing.kind].named, { studio: studioName });

export { describeBrowsing };
