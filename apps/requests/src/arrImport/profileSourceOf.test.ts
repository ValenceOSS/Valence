import { describe, expect, it } from 'vitest';
import { profileSourceOf } from './profileSourceOf';

describe('profileSourceOf', () => {
  it('names a profile by its app’s address and its id there', () => {
    expect(
      profileSourceOf(
        {
          source: {
            kind: 'radarr',
            url: 'http://Radarr:7878/',
            apiKey: '',
            name: 'Radarr',
            version: null,
            foundThrough: null,
            problem: null,
          },
        },
        4,
      ),
    ).toBe('http://radarr:7878#4');
  });
});
