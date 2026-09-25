import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { ShelfMoreCard } from '@ValenceScreens/components/RequestsPage/components/ShelfMoreCard/ShelfMoreCard';
import type { TitleShelfProps } from './TitleShelf.types';
import { useIsTitleWatched } from '@ValenceScreens/requests/useIsTitleWatched';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import { say } from '@ValenceI18n/say';

const BEHIND_MORE = 4;

/**
 * One shelf of films or series to ask for, ending in the card that opens the whole list it was
 * taken from where there is one.
 *
 * @param shelf - What is on the shelf, and what it was taken from.
 * @param onAsk - Called with the title to open, as its address names it.
 * @param onBrowse - Called with the whole list to show.
 */
const TitleShelf = ({ shelf, onAsk, onBrowse }: TitleShelfProps) => {
  const isWatched = useIsTitleWatched();
  const { browse } = shelf;

  const openAll =
    browse === null
      ? undefined
      : () => {
          onBrowse(browse);
        };

  return (
    <Rail
      title={shelf.title}
      sizesCards
      {...(openAll === undefined ? {} : { onOpenTitle: openAll })}
    >
      {shelf.titles.map((title, at) => (
        <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
          <MediaCard
            title={title.title}
            subtitle={title.year?.toString() ?? ''}
            {...describeCatalogueCard(title, isWatched(title))}
            {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
            onSelect={() => {
              onAsk(askingOf(title));
            }}
          />
        </RevealItem>
      ))}

      {openAll === undefined ? null : (
        <RevealItem index={shelf.titles.length} className="shrink-0 snap-start">
          <ShelfMoreCard
            label={say('screens.titleShelf.seeAllOf', { shelf: shelf.title.toLowerCase() })}
            posterUrls={shelf.titles
              .map((title) => title.posterUrl)
              .filter((posterUrl) => posterUrl !== null)
              .slice(0, BEHIND_MORE)}
            onOpen={openAll}
          />
        </RevealItem>
      )}
    </Rail>
  );
};

TitleShelf.displayName = 'TitleShelf';

export { TitleShelf };
