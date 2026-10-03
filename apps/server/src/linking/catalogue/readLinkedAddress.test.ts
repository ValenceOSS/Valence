import { describe, expect, it } from 'vitest';
import { linkedAddressOf } from './linkedAddressOf';
import { readLinkedAddress } from './readLinkedAddress';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

describe('readLinkedAddress', () => {
  it('reads back the server and the route an address was made of', () => {
    expect(readLinkedAddress(linkedAddressOf(FILMS, '/api/books/one/cover'))).toEqual({
      serverId: FILMS,
      route: '/api/books/one/cover',
    });
  });

  it('reads nothing from a path of this server’s own', () => {
    expect(readLinkedAddress('/media/films/Arrival.mkv')).toBeNull();
    expect(readLinkedAddress('https://image.tmdb.org/t/p/w500/poster.jpg')).toBeNull();
  });

  it('reads nothing from a linked address that names no server or a route outside /api', () => {
    expect(readLinkedAddress('linked://films/api/books/one/cover')).toBeNull();
    expect(readLinkedAddress(`linked://${FILMS}/admin`)).toBeNull();
    expect(readLinkedAddress(`linked://${FILMS}/api/books/one cover`)).toBeNull();
  });
});
