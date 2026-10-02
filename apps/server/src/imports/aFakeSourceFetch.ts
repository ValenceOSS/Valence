import type { SourceFetch } from './createSourceCaller';

type FakeAsked = {
  method: string;
  url: URL;
  headers: Record<string, string>;
};

type FakeAnswer = {
  status?: number;
  body: string;
  contentType?: string;
};

/**
 * A stand-in for a Jellyfin, Emby or Plex server on the network, answering each request with what
 * the test says it would and remembering every request, so a test can say what was asked and how.
 *
 * @param answer - What the server says to each request, or null for a 404.
 * @returns The fetch to read through, and every request it was asked.
 */
const aFakeSourceFetch = (answer: (asked: FakeAsked) => FakeAnswer | null) => {
  const calls: FakeAsked[] = [];
  const fetch: SourceFetch = (url, init) => {
    const asked = { method: init.method, url: new URL(url), headers: init.headers };

    calls.push(asked);

    const found = answer(asked);

    return Promise.resolve(
      found === null
        ? new Response('', { status: 404 })
        : new Response(found.body, {
            status: found.status ?? 200,
            headers: { 'content-type': found.contentType ?? 'application/json' },
          }),
    );
  };

  return { fetch, calls };
};

export type { FakeAnswer, FakeAsked };

export { aFakeSourceFetch };
