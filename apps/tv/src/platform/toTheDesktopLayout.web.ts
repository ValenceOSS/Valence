import { chooseTheLayout } from '@ValenceClient/platform/chooseTheLayout';
import type { toTheDesktopLayout as onTheTelevision } from '@ValenceTv/platform/toTheDesktopLayout';

/**
 * How to switch this television's browser to the web app's layout, from now on.
 *
 * @param page - The browser's document, its own unless a test says otherwise.
 * @returns What switches it.
 */
const toTheDesktopLayout: typeof onTheTelevision =
  (page: Parameters<typeof chooseTheLayout>[1] = document) =>
  () => {
    chooseTheLayout('web', page);
  };

export { toTheDesktopLayout };
