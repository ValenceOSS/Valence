import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';

const WIDE_FROM = '(min-width: 64rem)';

/**
 * Whether the page is wide enough to stand the music library and the side panels beside the page,
 * which is the large breakpoint. Below it they are drawers, opened when asked for, since a column
 * squeezed into a phone's width is a sliver nobody can use.
 *
 * @returns Whether there is room for the panels beside the page.
 */
const useRoomForThePanels = (): boolean => useMatchesMedia(WIDE_FROM);

export { useRoomForThePanels };
