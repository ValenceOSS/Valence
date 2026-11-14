import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

const VIDEO = new Set(['movies', 'tvshows']);

/**
 * Whether a Jellyfin view holds films or programmes, which are what Valence's apps show from it.
 *
 * @param view - The view.
 * @returns Whether to show it.
 */
const isJellyfinVideoView = (view: JellyfinItem): boolean => VIDEO.has(view.CollectionType ?? '');

export { isJellyfinVideoView };
