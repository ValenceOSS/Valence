import { describe, expect, it } from 'vitest';
import { askOf } from './askOf';

const RADARR = { id: 1, kind: 'radarr' as const, url: ' http://radarr:7878 ', apiKey: ' key ' };

const EMPTY = { id: 2, kind: 'sonarr' as const, url: '', apiKey: '' };

describe('askOf', () => {
  it('asks with every app given both an address and a key, and every mapping filled in', () => {
    expect(
      askOf(
        [RADARR, EMPTY],
        [
          { from: '/movies', to: '/media/Films' },
          { from: '/tv', to: '' },
        ],
        { a: 'secret', b: ' ' },
        { films: 'takeOver' },
      ),
    ).toEqual({
      ask: {
        sources: [{ kind: 'radarr', url: 'http://radarr:7878', apiKey: 'key' }],
        pathMappings: [{ from: '/movies', to: '/media/Films' }],
        secrets: { a: 'secret' },
        choices: { films: 'takeOver' },
      },
      problem: null,
    });
  });

  it('says what is missing where an app has only half of what it needs, or none is given', () => {
    expect(askOf([{ ...EMPTY, url: 'http://sonarr:8989' }], [], {}, {}).problem).toBe(
      'Give Sonarr both an address and an API key, or leave both empty.',
    );
    expect(askOf([EMPTY], [], {}, {}).problem).toBe('Give at least one app’s address and API key.');
  });
});
