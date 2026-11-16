import { describe, expect, it } from 'vitest';
import { PlaybackNoteSchema } from './PlaybackNote';

describe('PlaybackNoteSchema', () => {
  it('takes a recovery the player made where it was', () => {
    expect(
      PlaybackNoteSchema.safeParse({
        kind: 'recovered',
        mediaId: 'film-1',
        sessionId: null,
        atSeconds: 1669.4,
      }).success,
    ).toBe(true);
  });

  it('takes a jump a watch party made somebody take', () => {
    expect(
      PlaybackNoteSchema.safeParse({
        kind: 'caughtUp',
        partyId: 'p-1',
        fromSeconds: 0,
        toSeconds: 1424,
        because: 'drifted',
      }).success,
    ).toBe(true);
  });

  it('takes the reason a player handed a film from its engine to the server', () => {
    expect(
      PlaybackNoteSchema.safeParse({
        kind: 'engineHandedOver',
        mediaId: 'film-1',
        sessionId: null,
        atSeconds: 0,
        stage: 'opening',
        detail: 'Failed to fetch',
      }).success,
    ).toBe(true);
  });

  it('refuses a place before the start', () => {
    expect(
      PlaybackNoteSchema.safeParse({
        kind: 'recovered',
        mediaId: 'film-1',
        sessionId: null,
        atSeconds: -1,
      }).success,
    ).toBe(false);
  });
});
