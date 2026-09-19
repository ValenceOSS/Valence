import { vi } from 'vitest';
import type { ClientFetch } from '@ValenceRequests/downloads/DownloadClientAdapter';

type FakeRequest = {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body: string | FormData | undefined;
};

type FakeRoutes = Record<string, (request: FakeRequest) => Response | Promise<Response>>;

/**
 * A download client that answers by method and path — `POST /api/v2/auth/login`, say — and 404s
 * anything else, remembering everything it was asked.
 *
 * @param routes - What it answers.
 * @returns The fetch to hand an adapter, and what it was asked.
 */
const aFakeClient = (routes: FakeRoutes) => {
  const asked: FakeRequest[] = [];
  const fetch = vi.fn<ClientFetch>(async (address, init) => {
    const request: FakeRequest = {
      url: new URL(address),
      method: init.method,
      headers: init.headers,
      body: init.body,
    };

    asked.push(request);

    const route = routes[`${init.method} ${request.url.pathname}`];

    return route === undefined ? new Response('Not Found', { status: 404 }) : route(request);
  });

  return { fetch, asked };
};

export type { FakeRequest };

export { aFakeClient };
