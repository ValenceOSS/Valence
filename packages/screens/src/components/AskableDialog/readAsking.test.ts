import { describe, expect, it } from 'vitest';
import { readAsking } from './readAsking';

describe('readAsking', () => {
  it('reads a title’s kind and id', () => {
    expect(readAsking('film:438631')).toEqual({ kind: 'film', id: '438631' });
    expect(readAsking('album:deezer-7')).toEqual({ kind: 'album', id: 'deezer-7' });
    expect(readAsking('book:21277329')).toEqual({ kind: 'book', id: '21277329' });
  });

  it('reads nothing that could not be a title', () => {
    expect(readAsking(null)).toBeNull();
    expect(readAsking('novel:1')).toBeNull();
    expect(readAsking('film')).toBeNull();
    expect(readAsking('film:')).toBeNull();
  });
});
