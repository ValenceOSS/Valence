import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { describeStanding } from '@ValenceScreens/components/AskableDialog/describeStanding';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { DiscoverShelvesProps } from './DiscoverShelves.types';

/**
 * The badges on a title's card: what kind of thing it is, and where it stands where it is not
 * simply there to be asked for.
 *
 * @param title - The title.
 * @returns The badges.
 */
const badgesOf = (title: CatalogueTitle): string[] => {
  const standing = describeStanding(title.standing);

  return [REQUEST_KIND_NAMES[title.kind], ...(standing === null ? [] : [standing.label])];
};

/**
 * The Discover side of the Requests page, in the spirit of Overseerr: shelves of films and series
 * trending, popular and coming,
 * and the albums and artists most listened to — each marked with what it is and whether it is in
 * the library already or asked for. Choosing one opens its page, where it can be asked for.
 *
 * @param onAsk - Called with the title to open, as its address names it.
 */
const DiscoverShelves = ({ onAsk }: DiscoverShelvesProps) => {
  const shelves = useQuery(requestsQueries.discover());

  return (
    <div className="flex flex-col gap-10">
      {shelves.isError ? (
        <CouldNotRead
          what="What there is to ask for"
          isTryingAgain={shelves.isFetching}
          onTryAgain={() => {
            void shelves.refetch();
          }}
        />
      ) : shelves.data === undefined ? (
        <Spinner label="Reading what there is to ask for" />
      ) : (
        shelves.data.map((shelf) =>
          shelf.titles.every((title) => isMusicRequest(title.kind)) ? (
            <Rail key={shelf.id} title={shelf.title} sizesCards>
              {shelf.titles.map((title, at) => (
                <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
                  <MusicTile
                    title={title.title}
                    detail={[title.subtitle, describeStanding(title.standing)?.label ?? null]
                      .filter((part) => part !== null)
                      .join(' · ')}
                    shape={title.kind === 'artist' ? 'round' : 'square'}
                    artwork={
                      <MusicArtwork
                        src={title.posterUrl}
                        label={`The cover of ${title.title}`}
                        shape={title.kind === 'artist' ? 'round' : 'square'}
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
          ) : (
            <Rail key={shelf.id} title={shelf.title} sizesCards>
              {shelf.titles.map((title, at) => (
                <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
                  <MediaCard
                    title={title.title}
                    subtitle={title.year?.toString() ?? ''}
                    badges={badgesOf(title)}
                    {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
                    onSelect={() => {
                      onAsk(askingOf(title));
                    }}
                  />
                </RevealItem>
              ))}
            </Rail>
          ),
        )
      )}
    </div>
  );
};

DiscoverShelves.displayName = 'DiscoverShelves';

export { DiscoverShelves };
