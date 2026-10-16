import { motion } from 'motion/react';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { VirtualGrid } from '@ValenceUI/VirtualGrid';
import { useArrivals } from '@ValenceScreens/motion/useArrivals';
import type { MusicShelfProps } from './MusicShelf.types';

const LEAST_TILE_WIDTH = 168;

const TILE_HEIGHT = 230;

const GAP = 24;

/**
 * A run of albums, artists or playlists under a heading, either as a rail that pages sideways —
 * the same rail the film pages use — or as a grid that wraps, for a page that is only that list.
 *
 * In a rail each tile is revealed a moment after the one before it, so a shelf assembles rather
 * than appears. The grid draws only the rows in view, since a page of every album in a large
 * library would otherwise hold thousands of tiles and their artwork at once; its first screenful
 * arrives one after another and a tile scrolled away and back simply appears.
 *
 * @param heading - What the shelf holds.
 * @param layout - A rail to page through, or a grid to scroll down.
 * @param count - How many there are, where that is worth saying.
 * @param action - Anything to do with the whole shelf, beside its heading.
 * @param tiles - The tiles, each under the key it is known by.
 */
const MusicShelf = ({ heading, layout = 'rail', count, action, tiles }: MusicShelfProps) => {
  const arrivalOf = useArrivals();

  if (layout === 'rail') {
    return (
      <Rail
        title={heading}
        sizesCards
        cards="portrait"
        className="[--rail-lane:var(--music-lane)] sm:[--rail-lane:var(--music-lane)]"
        {...(count === undefined ? {} : { count })}
        {...(action === undefined ? {} : { action })}
      >
        {tiles.map(({ key, tile }, at) => (
          <RevealItem key={key} index={at}>
            {tile}
          </RevealItem>
        ))}
      </Rail>
    );
  }

  return (
    <section aria-label={heading} className="flex flex-col gap-4 px-[var(--music-lane)]">
      <header className="flex items-end justify-between gap-4">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-text">
          {heading}
          {count === undefined ? null : (
            <FormattedNumber value={count} className="text-sm font-normal text-text-muted/70" />
          )}
        </h2>
        {action}
      </header>

      <VirtualGrid
        count={tiles.length}
        leastCardWidth={LEAST_TILE_WIDTH}
        rowHeight={TILE_HEIGHT}
        gap={GAP}
        label={heading}
      >
        {(at) => {
          const one = tiles[at];

          return one === undefined ? null : (
            <motion.div key={one.key} {...arrivalOf(one.key)}>
              {one.tile}
            </motion.div>
          );
        }}
      </VirtualGrid>
    </section>
  );
};

MusicShelf.displayName = 'MusicShelf';

export { MusicShelf };
