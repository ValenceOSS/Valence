import { MediaCard } from '@ValenceUI/MediaCard';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import type { AskableBookTileProps } from './AskableBookTile.types';

/**
 * One book that can be asked for, drawn as a poster card: who wrote it and when, where it stands with
 * this server — in the library already, asked for, or there to be asked for — and pressing it opens
 * the page for asking.
 *
 * @param title - The book.
 * @param onAsk - Told what was chosen, in the form the address knows it by.
 */
const AskableBookTile = ({ title, onAsk }: AskableBookTileProps) => (
  <MediaCard
    title={title.title}
    subtitle={[title.subtitle, title.year?.toString() ?? null]
      .filter((part) => part !== null)
      .join(' · ')}
    {...describeCatalogueCard(title)}
    {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
    onSelect={() => {
      onAsk(askingOf(title));
    }}
  />
);

AskableBookTile.displayName = 'AskableBookTile';

export { AskableBookTile };
