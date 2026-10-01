import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { ArrFetch } from '@ValenceRequests/arrApps/createArrCaller';

type FakeArrAsked = { method: string; path: string; query: URLSearchParams; body: JsonValue };

type FakeArrAnswer = { status?: number; body: JsonValue };

type FakeArrRoute = FakeArrAnswer | ((asked: FakeArrAsked) => FakeArrAnswer);

/**
 * A Radarr, Sonarr, Lidarr or Prowlarr that answers each method and path from a table and keeps
 * everything it was asked, answering anything not in the table as the apps do a path they lack.
 *
 * @param routes - Each answer, keyed by its method and path, such as `GET /api/v3/movie`.
 * @returns How to ask it, and what it has been asked.
 */
const aFakeArr = (routes: Record<string, FakeArrRoute>) => {
  const asked: FakeArrAsked[] = [];

  const fetch: ArrFetch = (url, init) => {
    const address = new URL(url);
    const one: FakeArrAsked = {
      method: init.method,
      path: address.pathname,
      query: address.searchParams,
      body: init.body === undefined ? null : JsonValueSchema.parse(JSON.parse(init.body)),
    };

    asked.push(one);

    const route = routes[`${one.method} ${one.path}`];
    const answer =
      route === undefined
        ? { status: 404, body: { message: 'NotFound' } }
        : typeof route === 'function'
          ? route(one)
          : route;

    return Promise.resolve(
      new Response(answer.body === null ? null : JSON.stringify(answer.body), {
        status: answer.status ?? 200,
      }),
    );
  };

  return {
    fetch,
    asked,
    sent: (method: string, path: string): JsonValue[] =>
      asked.filter((one) => one.method === method && one.path === path).map((one) => one.body),
  };
};

export { aFakeArr };
