import type {
  CatalogueBrowse,
  CatalogueBrowseKind,
  CatalogueList,
} from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

const KIND_WORDS: Record<CatalogueBrowseKind, string> = { film: 'films', series: 'series' };

const LIST_WORDS: Record<CatalogueList, string> = {
  trending: say('screens.requests.describeBrowsing.trending'),
  popular: say('common.popular'),
  upcoming: say('screens.requests.describeBrowsing.coming'),
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
    ? `${LIST_WORDS[browsing.list]} ${KIND_WORDS[browsing.kind]}`
    : `${studioName ?? say('screens.requests.describeBrowsing.studio')} ${KIND_WORDS[browsing.kind]}`;

export { describeBrowsing };
