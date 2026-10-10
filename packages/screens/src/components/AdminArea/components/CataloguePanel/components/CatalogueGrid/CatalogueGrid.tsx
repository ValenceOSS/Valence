import { Checkbox } from '@ValenceUI/Checkbox';
import { MediaCard } from '@ValenceUI/MediaCard';
import { VirtualGrid } from '@ValenceUI/VirtualGrid';
import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';
import { catalogueArtUrl } from '@ValenceClient/requests/catalogueArtUrl';
import { meterOf } from './meterOf';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';
import type { CatalogueGridProps } from './CatalogueGrid.types';
import { say } from '@ValenceI18n/say';

const CARD_WIDTHS: Readonly<Record<MediaGridSize, number>> = {
  small: 130,
  medium: 170,
  large: 220,
};

const PHONE_CARD_WIDTHS: Readonly<Record<MediaGridSize, number>> = {
  small: 90,
  medium: 130,
  large: 220,
};

const ROOM_OF_A_TABLET = '(min-width: 48rem)';

const POSTER_TO_WIDTH = 1.5;

const UNDER_A_CARD = 64;

/**
 * The Catalogue's titles as posters, at the size the library pages use, each with a bar along its
 * foot saying where it stands and how much of it is here. While choosing, a title waiting on
 * approval wears a box to tick. On a phone the cards are allowed narrower, so two fit across at the
 * middle size rather than one poster the width of the screen.
 *
 * @param entries - The titles shown.
 * @param size - How large the cards are.
 * @param isSquare - Whether the art is square, as album covers and artists are.
 * @param isChoosing - Whether titles are being chosen to approve or decline together.
 * @param chosen - The keys of the titles chosen.
 * @param onChoose - Told a title ticked or unticked.
 * @param onOpen - Told a title opened.
 */
const CatalogueGrid = ({
  entries,
  size,
  isSquare,
  isChoosing,
  chosen,
  onChoose,
  onOpen,
}: CatalogueGridProps) => {
  const least = (useMatchesMedia(ROOM_OF_A_TABLET) ? CARD_WIDTHS : PHONE_CARD_WIDTHS)[size];

  return (
    <VirtualGrid
      count={entries.length}
      label={say('screens.adminArea.cataloguePanel.titles')}
      leastCardWidth={least}
      rowHeight={least * (isSquare ? 1 : POSTER_TO_WIDTH) + UNDER_A_CARD}
    >
      {(at) => {
        const entry = entries[at];

        if (entry === undefined) {
          return null;
        }

        const imageUrl = catalogueArtUrl(entry);
        const isChoosable = isChoosing && entry.status === 'toApprove' && entry.requestId !== null;

        return (
          <div className="relative">
            <MediaCard
              title={entry.title}
              subtitle={entry.subtitle ?? entry.year?.toString() ?? ''}
              {...(imageUrl === null ? {} : { imageUrl })}
              shape={isSquare ? 'square' : 'poster'}
              meter={meterOf(entry)}
              onSelect={() => {
                if (isChoosable) {
                  onChoose(entry.key, !chosen.has(entry.key));
                } else {
                  onOpen(entry);
                }
              }}
            />

            {isChoosable ? (
              <span className="absolute left-2 top-2 rounded-md bg-[var(--card-face)] p-1 shadow-[var(--shadow-raised)]">
                <Checkbox
                  label={say('common.selectTitle', { title: entry.title })}
                  isLabelHidden
                  checked={chosen.has(entry.key)}
                  onCheckedChange={(isChosen) => {
                    onChoose(entry.key, isChosen);
                  }}
                />
              </span>
            ) : null}
          </div>
        );
      }}
    </VirtualGrid>
  );
};

CatalogueGrid.displayName = 'CatalogueGrid';

export { CatalogueGrid };
