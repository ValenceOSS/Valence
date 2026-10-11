import { createLiveFetch } from './createLiveFetch';

type LiveRoute = 'direct' | 'proxy';

/**
 * A fetch that asks one way first and the other where the first does not answer well — refused,
 * missing or not reached at all — giving back the second answer only where it is better.
 *
 * @param first - The way asked first.
 * @param second - The way asked where the first fails, if there is one.
 * @returns The fetch.
 */
const fallingBack =
  (first: typeof fetch, second: typeof fetch | null): typeof fetch =>
  async (input, init) => {
    const firstAnswer = await first(input, init).catch(() => null);

    if ((firstAnswer !== null && firstAnswer.ok) || second === null) {
      return firstAnswer ?? first(input, init);
    }

    const secondAnswer = await second(input, init).catch(() => null);

    if (secondAnswer !== null && (secondAnswer.ok || firstAnswer === null)) {
      void firstAnswer?.body?.cancel();

      return secondAnswer;
    }

    return firstAnswer ?? second(input, init);
  };

/**
 * The ways live TV reaches the outside world: this server's own connection, and a proxy where one
 * is set. A proxy is only the way round where this server's own way is refused — a channel that
 * plays from here plays from here — and which way a channel's stream answered is remembered, so the
 * rest of it is asked the same way. Logos go the other way about, through the proxy first, since
 * image hosts are what block whole countries.
 *
 * @param proxy - The proxy's address, or nothing where there is none.
 * @returns The routes.
 */
const createLiveRoutes = (proxy: string) => {
  const through = proxy === '' ? null : createLiveFetch(proxy);
  const chosen = new Map<string, LiveRoute>();

  return {
    proxy: proxy === '' ? null : proxy,
    hasProxy: through !== null,
    fetcherOf: (route: LiveRoute): typeof fetch =>
      route === 'proxy' && through !== null ? through : fetch,
    routeOf: (channelId: string): LiveRoute => chosen.get(channelId) ?? 'direct',
    choose: (channelId: string, route: LiveRoute): void => {
      chosen.set(channelId, route);
    },
    readings: fallingBack(fetch, through),
    logos: through === null ? fetch : fallingBack(through, fetch),
  };
};

type LiveRoutes = ReturnType<typeof createLiveRoutes>;

export type { LiveRoute, LiveRoutes };

export { createLiveRoutes };
