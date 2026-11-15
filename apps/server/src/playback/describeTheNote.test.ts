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
