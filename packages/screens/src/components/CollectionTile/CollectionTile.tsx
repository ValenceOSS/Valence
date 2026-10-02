import { Button } from '@ValenceUI/Button';
import { CollectionCover } from '@ValenceScreens/components/CollectionCover/CollectionCover';
import type { CollectionTileProps } from './CollectionTile.types';
import { sayCount } from '@ValenceI18n/sayCount';

const LIFTS = [
  'transition-[translate,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
  'hover-hover:group-hover/tile:-translate-y-1 group-active/tile:scale-[0.98]',
  'motion-reduce:transition-none motion-reduce:hover-hover:group-hover/tile:translate-y-0',
].join(' ');

/**
 * A collection on a shelf: its cover standing upright among the posters, its name, and how many
 * films and programmes in it this viewer may see. Pressing it opens the collection.
 *
 * @param collection - The collection.
 * @param onOpen - Told it was chosen.
 */
const CollectionTile = ({ collection, onOpen }: CollectionTileProps) => (
  <div className="group/tile min-w-0">
    <Button
      variant="bare"
      size="none"
      hasTooltip={false}
      className="flex w-full min-w-0 flex-col items-stretch gap-3 rounded-lg text-left"
      onClick={onOpen}
    >
      <span className={`block rounded-lg shadow-[var(--shadow-artwork)] ${LIFTS}`}>
        <CollectionCover collection={collection} className="w-full" />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-text">
          {collection.name}
        </span>
        <span className="truncate text-[0.8125rem] text-text-muted">
          {sayCount('common.count.titles', collection.entryCount)}
        </span>
      </span>
    </Button>
  </div>
);

CollectionTile.displayName = 'CollectionTile';

export { CollectionTile };
