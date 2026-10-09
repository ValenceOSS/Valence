import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { Spinner } from '@ValenceUI/Spinner';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import { AskableBookTile } from '@ValenceScreens/components/RequestsPage/components/AskableBookTile/AskableBookTile';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { useIsTitleWatched } from '@ValenceScreens/requests/useIsTitleWatched';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { DiscoverResultsProps } from './DiscoverResults.types';
import { say } from '@ValenceI18n/say';

/**
 * What Discover's search found in the catalogues that is not on the server yet, a rail for each
 * kind a library takes requests for — films, shows, artists and books — each title marked with
 * where it stands. Choosing one opens its page, where it can be asked for.
 *
 * @param query - What was searched for.
 * @param onAsk - Called with the title to open, as its address names it.
 */
const DiscoverResults = ({ query, onAsk }: DiscoverResultsProps) => {
  const isWatched = useIsTitleWatched();
  const found = useDiscoverSearch(query);

  /**
   * A rail of films or shows.
   *
   * @param title - What the rail holds.
   * @param titles - The titles.
   * @returns The rail, or nothing where it would be empty.
   */
  const posters = (title: string, titles: readonly CatalogueTitle[]) =>
    titles.length === 0 ? null : (
      <Rail title={title} sizesCards cards="poster" className="-mx-[var(--rail-lane)]">
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
      </Rail>
    );

  if (found.isPending && found.count === 0) {
    return <Spinner isCentered label={say('common.readingTheCatalogue')} />;
  }

  if (found.count === 0) {
    return (
      <p className="py-12 text-center text-text-muted">
        {say('screens.requestsPage.nothingInTheCataloguesMatches', { query })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {posters(say('common.movies'), found.films)}
      {posters(say('common.shows'), found.shows)}

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
