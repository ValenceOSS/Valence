import type { ListPlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaPanel.types';

/**
 * Writes how Media's list is searched, filtered and sorted into the address, leaving out what is as
 * it starts, so an address names only what somebody changed.
 *
 * @param place - The library, search, quick filter, order and filter chips.
 * @returns The address's search, for the list.
 */
const searchOfList = (place: ListPlace) => ({
  ...(place.library === null ? {} : { library: place.library }),
  ...(place.search === '' ? {} : { find: place.search }),
  ...(place.show === 'all' ? {} : { quick: place.show }),
  ...(place.sort === 'title' ? {} : { order: place.sort }),
  ...(place.isDescending ? { desc: true } : {}),
  ...(place.filters.length === 0 ? {} : { filter: [...place.filters] }),
});

export { searchOfList };
