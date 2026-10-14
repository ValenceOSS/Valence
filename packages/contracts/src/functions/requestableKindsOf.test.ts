import { describe, expect, it } from 'vitest';
import { requestableKindsOf } from './requestableKindsOf';

describe('requestableKindsOf', () => {
  it('names the kinds a library takes requests for', () => {
    expect(
      requestableKindsOf([
        { kind: 'movies', takesRequests: true },
        { kind: 'music', takesRequests: true },
        { kind: 'shows', takesRequests: false },
      ]),
    ).toEqual(['film', 'artist', 'album']);
  });

  it('takes series and films for an anime library', () => {
    expect(requestableKindsOf([{ kind: 'anime', takesRequests: true }])).toEqual([
      'film',
      'series',
    ]);
  });

  it('names none for a server with no library that takes requests', () => {
    expect(requestableKindsOf([])).toEqual([]);
  });
});
