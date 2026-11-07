import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import type { CatalogueBookRowProps } from './CatalogueBookRow.types';
import { say } from '@ValenceI18n/say';

/**
 * A row of books from Open Library in a book's dialog, each saying whether it is in the library,
 * asked for, or there to be asked for — badged so — one in the library opens its own dialog, and any other opens
 * the dialog that asks for it, for whoever may. Nothing is drawn where there are none.
 *
 * @param heading - What the row is, such as the books by the same author.
 * @param titles - The books.
 * @param isByOthers - Whether the books are by other authors, so each says who wrote it.
 * @param onOpenBook - Told to open a book the library holds.
 * @param onAsk - Told to open a book to ask for, as its address names it, and left out for whoever
 *   may not request.
 */
const CatalogueBookRow = ({
  heading,
  titles,
  isByOthers = false,
  onOpenBook,
  onAsk,
}: CatalogueBookRowProps) => {
  const shown =
    onAsk === undefined ? titles.filter((title) => title.standing.status === 'library') : titles;

  if (shown.length === 0) {
    return null;
  }

  return (
    <DialogSection>
      <Rail
        title={heading}
        sizesCards
        cards="portrait"
        hasArrows={false}
        look="title"
        className="px-0"
      >
        {shown.map((title, at) => (
          <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
            <MediaCard
              title={title.title}
              subtitle={[isByOthers ? title.subtitle : null, title.year?.toString() ?? null]
                .filter((part) => part !== null)
                .join(' · ')}
              badges={
                title.standing.status === 'askable'
                  ? [say('common.request')]
                  : describeCatalogueCard(title).badges
              }
              {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
              onSelect={() => {
                const { mediaId, status } = title.standing;

                if (status === 'library' && mediaId !== null) {
                  onOpenBook(mediaId);

                  return;
                }

                onAsk?.(askingOf(title));
              }}
            />
          </RevealItem>
        ))}
      </Rail>
    </DialogSection>
  );
};

CatalogueBookRow.displayName = 'CatalogueBookRow';

export { CatalogueBookRow };
