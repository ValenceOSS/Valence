import { vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = JsonValue | { status: number; body: JsonValue };

const PROFILE = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Dan',
  colour: '#3a8ee8',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ALWAYS: Record<string, Answer> = {
  '/api/profiles': { profiles: [PROFILE] },
  '/api/favourites': { favourites: [] },
  '/api/playlists': { playlists: [] },
  '/api/music/devices': { devices: [] },
};

/**
 * Tells an answer with a status apart from a body that happens to be an object.
 *
 * @param answer - The answer.
 * @returns Whether it names its own status.
 */
const hasStatus = (answer: Answer): answer is { status: number; body: JsonValue } =>
  typeof answer === 'object' &&
  answer !== null &&
  !Array.isArray(answer) &&
  typeof answer.status === 'number' &&
  'body' in answer;

/**
 * Answers a music screen's requests from a table of addresses, so a screen can be drawn against
 * the real readers without a server. The longest address a request starts with answers it; a
 * signed-in profile, no favourites, no playlists and no other devices are answered unless the
 * table says otherwise, and anything else is a 404.
 *
 * @param routes - What each address answers, by the start of the address.
 * @returns A stand-in for `fetch`, which records what it was asked.
 */
const answerMusicRequests = (routes: Record<string, Answer> = {}) => {
  const table = { ...ALWAYS, ...routes };
  const addresses = Object.keys(table).sort((left, right) => right.length - left.length);

  return vi.fn((input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const found = addresses.find((address) => url.startsWith(address));
    const answer = found === undefined ? undefined : table[found];

    if (answer === undefined) {
      return Promise.resolve(new Response(JSON.stringify({ error: 'Not here.' }), { status: 404 }));
    }

    const { status, body } = hasStatus(answer) ? answer : { status: 200, body: answer };

    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });
};

export { answerMusicRequests };
