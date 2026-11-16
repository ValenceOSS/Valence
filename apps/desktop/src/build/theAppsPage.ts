type DebuggingTarget = { type: string; url: string; webSocketDebuggerUrl?: string | undefined };

const UPDATE_PAGE = '/update.html';

/**
 * The page of the app's own window among what remote debugging lists: a page served from the
 * app's origin that can be driven, and not the update window's.
 *
 * @param targets - What remote debugging lists.
 * @param origin - Where the app's pages are served from, or its beginning.
 * @returns The address to drive the page at, or nothing where the app has no such page open.
 */
const theAppsPage = (targets: readonly DebuggingTarget[], origin: string): string | null =>
  targets.find(
    (target) =>
      target.type === 'page' &&
      target.url.startsWith(origin) &&
      !new URL(target.url).pathname.startsWith(UPDATE_PAGE) &&
      target.webSocketDebuggerUrl !== undefined,
  )?.webSocketDebuggerUrl ?? null;

export { theAppsPage };
