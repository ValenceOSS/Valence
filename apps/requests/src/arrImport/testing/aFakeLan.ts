import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { ArrFetch } from '@ValenceRequests/arrApps/createArrCaller';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import type { ArrImportConnect } from '@ValenceRequests/arrImport/readArrImport';
import { arrFixture } from '@ValenceRequests/arrImport/testing/arrFixture';

/**
 * A network of recorded apps, each answering at its own address from its fixture, keeping every
 * question any of them was asked; an address with no app behind it cannot be reached.
 *
 * @param apps - Each app's fixture, keyed by the origin it answers at.
 * @returns How to ask them, and everything they were asked.
 */
const aFakeLan = (apps: Readonly<Record<string, string>>) => {
  const fakes = new Map(
    Object.entries(apps).map(([origin, fixture]) => [origin, aFakeArr(arrFixture(fixture))]),
  );
  const asked: { origin: string; method: string; path: string; key: string }[] = [];

  const fetch: ArrFetch = (url, init) => {
    const address = new URL(url);
    const fake = fakes.get(address.origin);

    asked.push({
      origin: address.origin,
      method: init.method,
      path: address.pathname,
      key: init.headers['X-Api-Key'] ?? '',
    });

    return fake === undefined
      ? Promise.reject(new TypeError('fetch failed'))
      : fake.fetch(url, init);
  };

  const connect: ArrImportConnect = (source) => createArrCaller(fetch, source, 1);

  return { connect, asked, fetch };
};

export { aFakeLan };
