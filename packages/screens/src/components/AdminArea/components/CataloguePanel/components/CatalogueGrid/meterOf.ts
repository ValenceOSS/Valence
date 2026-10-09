import { TITLE_STATUS_NAMES } from '@ValenceClient/requests/TITLE_STATUS_NAMES';
import { TITLE_STATUS_TONES } from '@ValenceScreens/requests/TITLE_STATUS_TONES';
import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaCardMeter } from '@ValenceUI/MediaCard.types';
import { say } from '@ValenceI18n/say';

/**
 * The bar under a Catalogue poster: coloured by where the title stands, and filled to how much of
 * it is held where it is still on its way or missing something, with a word on hover saying so.
 *
 * @param entry - The title.
 * @returns The bar.
 */
const meterOf = (entry: CatalogueEntry): MediaCardMeter => {
  const isPart = (entry.status === 'downloading' || entry.status === 'missing') && entry.total > 0;
  const status = TITLE_STATUS_NAMES[entry.status];

  return {
    fraction: isPart ? entry.held / entry.total : 1,
    tone: TITLE_STATUS_TONES[entry.status].meter,
    label:
      entry.total > 1
        ? say('screens.adminArea.cataloguePanel.statusHeldOfTotal', {
            status,
            held: entry.held.toString(),
            total: entry.total.toString(),
          })
        : status,
  };
};

export { meterOf };
