const KEPT_FOR_MILLISECONDS = 60 * 60 * 1000;

const MOST_PER_VIEWER = 500;

const FETCH_WINDOW_MILLISECONDS = 60_000;

const MOST_FETCHES_PER_WINDOW = 600;

/**
 * Which outside pictures each plugin has drawn for each viewer, so the server fetches on a viewer's
 * behalf only a picture the plugin put in front of them, and only so fast: 600 a minute, enough
 * for a long page drawn on a few screens at once. Kept for an hour after it was last drawn, in
 * memory: after a restart a page draws again before its pictures are asked for.
 *
 * @param now - The clock.
 * @returns What was drawn for whom, and how often its pictures are fetched.
 */
const createDrawnPictures = (now: () => number = Date.now) => {
  const drawn = new Map<string, Map<string, number>>();
  const fetched = new Map<string, number[]>();

  const whose = (pluginId: string, profileId: string): string =>
    JSON.stringify([pluginId, profileId]);

  return {
    remember: (pluginId: string, profileId: string, urls: readonly string[]): void => {
      if (urls.length === 0) {
        return;
      }

      const at = now();
      const kept = drawn.get(whose(pluginId, profileId)) ?? new Map<string, number>();

      for (const [url, until] of kept) {
        if (until < at) {
          kept.delete(url);
        }
      }

      for (const url of urls) {
        kept.delete(url);
        kept.set(url, at + KEPT_FOR_MILLISECONDS);
      }

      for (const url of [...kept.keys()].slice(0, Math.max(0, kept.size - MOST_PER_VIEWER))) {
        kept.delete(url);
      }

      drawn.set(whose(pluginId, profileId), kept);
    },
    wasDrawn: (pluginId: string, profileId: string, url: string): boolean => {
      const until = drawn.get(whose(pluginId, profileId))?.get(url);

      return until !== undefined && until >= now();
    },
    mayFetch: (pluginId: string, profileId: string): boolean => {
      const at = now();
      const recent = (fetched.get(whose(pluginId, profileId)) ?? []).filter(
        (when) => when > at - FETCH_WINDOW_MILLISECONDS,
      );

      if (recent.length >= MOST_FETCHES_PER_WINDOW) {
        fetched.set(whose(pluginId, profileId), recent);

        return false;
      }

      fetched.set(whose(pluginId, profileId), [...recent, at]);

      return true;
    },
    forget: (pluginId: string): void => {
      for (const key of [...drawn.keys(), ...fetched.keys()]) {
        if (key.startsWith(JSON.stringify([pluginId]).slice(0, -1))) {
          drawn.delete(key);
          fetched.delete(key);
        }
      }
    },
  };
};

type DrawnPictures = ReturnType<typeof createDrawnPictures>;

export type { DrawnPictures };

export { createDrawnPictures };
