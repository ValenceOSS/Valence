import { describe, expect, it } from 'vitest';
import { plexHeadersOf } from './plexHeadersOf';

describe('plexHeadersOf', () => {
  it('carries the token and says who is asking', () => {
    expect(plexHeadersOf('t', 'c')).toEqual({
      'X-Plex-Token': 't',
      'X-Plex-Client-Identifier': 'c',
      'X-Plex-Product': 'Valence',
    });
  });
});
