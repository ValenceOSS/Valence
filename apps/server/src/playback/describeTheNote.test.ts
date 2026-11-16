import { describe, expect, it } from 'vitest';
import { describeTheNote } from '@ValenceServer/playback/describeTheNote';

describe('describeTheNote', () => {
  it('says where a player recovered by itself', () => {
    expect(
      describeTheNote(
        { kind: 'recovered', mediaId: 'film-1', sessionId: 's-1', atSeconds: 2413.6 },
        'Zen on macOS',
      ),
    ).toBe('Playback recovered by itself at 40:13 for Zen on macOS');
  });

  it('says where and why the browser player handed a film to the server', () => {
    expect(
      describeTheNote(
        {
          kind: 'engineHandedOver',
          mediaId: 'film-1',
          sessionId: null,
          atSeconds: 0,
          stage: 'opening',
          detail: 'Failed to fetch',
        },
        'Valence for Windows',
      ),
    ).toBe(
      'The browser player on Valence for Windows handed the film to the server at 0:00, failing to open the file: Failed to fetch',
    );
    expect(
      describeTheNote(
        {
          kind: 'engineHandedOver',
          mediaId: 'film-1',
          sessionId: 's-1',
          atSeconds: 61,
          stage: 'refused',
          detail: null,
        },
        'Zen on macOS',
      ),
    ).toBe(
      'The browser player on Zen on macOS handed the film to the server at 1:01, the browser refusing what it was given',
    );
  });

  it('says where a watch party moved somebody from and to, and why', () => {
    expect(
      describeTheNote(
        { kind: 'caughtUp', partyId: 'p-1', fromSeconds: 0, toSeconds: 1424, because: 'drifted' },
        'Zen on macOS',
      ),
    ).toBe('Watch party p-1 moved Zen on macOS from 0:00 to 23:44, after drifting');
    expect(
      describeTheNote(
        { kind: 'caughtUp', partyId: 'p-1', fromSeconds: 0, toSeconds: 61, because: 'joined' },
        'Zen on macOS',
      ),
    ).toBe('Watch party p-1 moved Zen on macOS from 0:00 to 1:01, on joining');
  });
});
