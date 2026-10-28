import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { Spinner } from '@ValenceUI/Spinner';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import { AskableBookTile } from '@ValenceScreens/components/RequestsPage/components/AskableBookTile/AskableBookTile';
import { ShelfMoreCard } from '@ValenceScreens/components/RequestsPage/components/ShelfMoreCard/ShelfMoreCard';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { useIsTitleWatched } from '@ValenceScreens/requests/useIsTitleWatched';
import type { CatalogueSearch, CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { DiscoverResultsProps } from './DiscoverResults.types';
import { say } from '@ValenceI18n/say';

const BEHIND_MORE = 4;

/**
 * What Discover's search found in the catalogues that is not on the server yet, a rail for each
 * kind a library takes requests for — films, shows, artists and books — each title marked with
 * where it stands. Choosing one opens its page, where it can be asked for. The films and shows
 * rails end in the card that opens everything the search found of that kind, where the server can
 * read further than a rail's worth.
 *
 * @param query - What was searched for.
 * @param onAsk - Called with the title to open, as its address names it.
 * @param onSeeAll - Called with the kind and the words, to show everything found of that kind.
 */
const DiscoverResults = ({ query, onAsk, onSeeAll }: DiscoverResultsProps) => {
  const isWatched = useIsTitleWatched();
  const found = useDiscoverSearch(query);
  const readsOn = useServerHas('requests.searchPages') === true;

  /**
   * A rail of films or shows.
   *
   * @param title - What the rail holds.
   * @param titles - The titles.
   * @param searching - The kind and the words, to show everything found of it.
   * @returns The rail, or nothing where it would be empty.
   */
  const posters = (
    title: string,
    titles: readonly CatalogueTitle[],
    searching: CatalogueSearch,
  ) => {
    const openAll =
      onSeeAll === undefined || !readsOn
        ? undefined
        : () => {
            onSeeAll(searching);
          };

    return titles.length === 0 ? null : (
      <Rail
        title={title}
        sizesCards
        cards="poster"
        className="-mx-[var(--rail-lane)]"
        {...(openAll === undefined ? {} : { onOpenTitle: openAll })}
      >
        {titles.map((one, at) => (
          <RevealItem key={`${one.kind}-${one.id}`} index={at} className="shrink-0 snap-start">
            <MediaCard
              title={one.title}
              subtitle={one.year?.toString() ?? ''}
              {...describeCatalogueCard(one, isWatched(one))}
              {...(one.posterUrl === null ? {} : { imageUrl: one.posterUrl })}
              onSelect={() => {
                onAsk(askingOf(one));
              }}
            />
          </RevealItem>
        ))}

        {openAll === undefined ? null : (
          <RevealItem index={titles.length} className="shrink-0 snap-start">
            <ShelfMoreCard
              label={say('screens.requestsPage.titleShelf.seeAllOfTitle', {
                title: title.toLowerCase(),
              })}
              posterUrls={titles
                .map((one) => one.posterUrl)
                .filter((posterUrl) => posterUrl !== null)
                .slice(0, BEHIND_MORE)}
              onOpen={openAll}
            />
          </RevealItem>
        )}
      </Rail>
    );
  };

  if (found.isPending && found.count === 0) {
    return <Spinner isCentered label={say('common.readingTheCatalogue')} />;
  }

  if (found.count === 0) {
    return (
      <p
        {...(found.problem === null ? {} : { role: 'alert' })}
        className="py-12 text-center text-text-muted"
      >
        {found.problem ?? say('screens.requestsPage.nothingInTheCataloguesMatches', { query })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {posters(say('common.movies'), found.films, { kind: 'film', query })}
      {posters(say('common.shows'), found.shows, { kind: 'series', query })}

      {found.artists.length === 0 ? null : (
        <Rail
          title={say('common.artists')}
          sizesCards
          cards="poster"
          className="-mx-[var(--rail-lane)]"
        >
          {found.artists.map((title, at) => (
            <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
              <MusicTile
                title={title.title}
                detail={[title.subtitle, describeStanding(title.standing)?.label ?? null]
                  .filter((part) => part !== null)
                  .join(' · ')}
                shape="round"
                artwork={
                  <MusicArtwork
                    src={title.posterUrl}
                    label={title.title}
                    shape="round"
                    className="w-full"
                  />
                }
                onOpen={() => {
                  onAsk(askingOf(title));
                }}
              />
            </RevealItem>
          ))}
        </Rail>
      )}

      {found.books.length === 0 ? null : (
        <Rail
          title={say('common.books')}
          sizesCards
          cards="poster"
          className="-mx-[var(--rail-lane)]"
        >
          {found.books.map((title, at) => (
            <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
              <AskableBookTile title={title} onAsk={onAsk} />
            </RevealItem>
          ))}
        </Rail>
      )}
    </div>
  );
};

DiscoverResults.displayName = 'DiscoverResults';

export { DiscoverResults };
