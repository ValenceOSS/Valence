import type { BrowseOrder } from '@ValenceClient/library/BrowseOrder';
import { say } from '@ValenceI18n/say';

/**
 * What an order is called wherever somebody chooses one, the same on every client.
 *
 * @param order - The order.
 * @returns Its name.
 */
const nameBrowseOrder = (order: BrowseOrder): string =>
  order === 'added'
    ? say('common.recentlyAdded')
    : order === 'released'
      ? say('common.releaseDate')
      : order === 'title'
        ? say('common.title')
        : order === 'rating'
          ? say('common.rating')
          : say('common.size');

export { nameBrowseOrder };
