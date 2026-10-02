import type { CatalogueTitleRef } from '@ValenceServer/calendar/CatalogueTitleRef';

/**
 * What a title in the catalogue is known by when its pictures are looked up, a film and a series
 * with the same number being different titles.
 *
 * @param title - The title.
 * @returns Its key.
 */
const catalogueTitleKey = (title: CatalogueTitleRef): string => `${title.kind}:${title.externalId}`;

export { catalogueTitleKey };
