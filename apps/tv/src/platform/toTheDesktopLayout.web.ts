import { chooseTheLayout } from '@ValenceClient/platform/chooseTheLayout';
import { runsTheWebApp } from '@ValenceCore/functions/runsTheWebApp';
import type { toTheDesktopLayout as onTheTelevision } from '@ValenceTv/platform/toTheDesktopLayout';

/**
 * How to switch this television's browser to the web app's layout, from now on, where the web app
 * runs on it at all. On a browser too old for it there is nothing to offer, since it would show a
 * white page with no way back.
 *
 * @param page - The browser's document, its own unless a test says otherwise.
 * @param userAgent - What the browser says it is, its own unless a test says otherwise.
 * @returns What switches it, or nothing where the web app would not run.
 */
const toTheDesktopLayout: typeof onTheTelevision = (
  page: Parameters<typeof chooseTheLayout>[1] = document,
  userAgent: string = window.navigator.userAgent,
) =>
  runsTheWebApp(userAgent)
    ? () => {
        chooseTheLayout('web', page);
      }
    : null;

export { toTheDesktopLayout };
