import { describe, expect, it } from 'vitest';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { readLinkedBytes } from './readLinkedBytes';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

describe('readLinkedBytes', () => {
  it('reads a picture whole from the server its address names', async () => {
    const asker = aLinkedAskerAnswering(() => new Response(new Uint8Array([1, 2, 3])));

    expect(await readLinkedBytes(asker, `linked://${FILMS}/api/books/one/cover`)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(asker.asked[0]).toMatchObject({ serverId: FILMS, route: '/api/books/one/cover' });
  });

  it('reads nothing where there is nothing, or the server could not be reached', async () => {
    expect(
      await readLinkedBytes(
        aLinkedAskerAnswering(() => new Response(null, { status: 404 })),
        `linked://${FILMS}/api/books/one/cover`,
      ),
    ).toBeNull();
    expect(
      await readLinkedBytes(
        aLinkedAskerAnswering(() => null),
        `linked://${FILMS}/api/books/one/cover`,
      ),
    ).toBeNull();
    expect(
      await readLinkedBytes(
        aLinkedAskerAnswering(() => new Response('x')),
        '/covers/one.jpg',
      ),
    ).toBeNull();
  });
});
