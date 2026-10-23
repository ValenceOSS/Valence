import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { claimTheSystemsControls } from '@ValenceScreens/playback/claimTheSystemsControls';
import { aFakeMediaSession } from '@ValenceScreens/testing/aFakeMediaSession';
import type { Claim } from '@ValenceScreens/playback/claimTheSystemsControls';

let session = aFakeMediaSession();

const held: Claim[] = [];

beforeEach(() => {
  session = aFakeMediaSession();
});

afterEach(() => {
  held.splice(0).forEach((claim) => {
    claim.release();
  });
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'mediaSession');
});

/**
 * Claims the controls for a player named so, whose play button says it was pressed.
 *
 * @param title - What it is playing.
 * @param pressed - Told each time its play button is pressed.
 * @returns The claim.
 */
const claimFor = (title: string, pressed: (title: string) => void): Claim => {
  const claim = claimTheSystemsControls({
    metadata: { title },
    handlers: [
      [
        'play',
        () => {
          pressed(title);
        },
      ],
    ],
  });

  held.push(claim);

  return claim;
};

describe('claimTheSystemsControls', () => {
  it('puts the latest claim on the controls', () => {
    const pressed = vi.fn();

    claimFor('Kid A', pressed);
    claimFor('Red Rising', pressed);
    session.press('play');

    expect(session.metadata?.title).toBe('Red Rising');
    expect(pressed).toHaveBeenCalledWith('Red Rising');
  });

  it('hands the controls back to the claim beneath as one lets go', () => {
    const pressed = vi.fn();
    const music = claimFor('Kid A', pressed);

    music.setPlaying(true);
    claimFor('Red Rising', pressed).release();
    session.press('play');

    expect(session.metadata?.title).toBe('Kid A');
    expect(session.playbackState).toBe('playing');
    expect(pressed).toHaveBeenCalledWith('Kid A');

    music.release();

    expect(session.metadata).toBeNull();
    expect(session.handlers.size).toBe(0);
  });

  it('gives the controls back to a claim beneath as it starts playing', () => {
    const pressed = vi.fn();
    const music = claimFor('Kid A', pressed);
    const book = claimFor('Red Rising', pressed);

    book.setPlaying(false);
    music.setPlaying(true);

    expect(session.metadata?.title).toBe('Kid A');

    music.setPlaying(false);

    expect(session.metadata?.title).toBe('Kid A');
    expect(session.playbackState).toBe('paused');
  });

  it('leaves the controls alone as a claim beneath lets go or pauses', () => {
    const pressed = vi.fn();
    const music = claimFor('Kid A', pressed);

    claimFor('Red Rising', pressed).setPlaying(true);
    music.setPlaying(false);
    music.release();

    expect(session.metadata?.title).toBe('Red Rising');
    expect(session.playbackState).toBe('playing');
  });

  it('shows what a claim on the controls says instead, and keeps it for a claim beneath', () => {
    const pressed = vi.fn();
    const below = claimFor('A song', pressed);
    const above = claimFor('A film', pressed);

    below.update({ metadata: { title: 'Another song' }, handlers: [] });

    expect(session.metadata?.title).toBe('A film');

    above.update({ metadata: { title: 'A film, with its poster' }, handlers: [] });

    expect(session.metadata?.title).toBe('A film, with its poster');

    above.release();

    expect(session.metadata?.title).toBe('Another song');
  });

  it('says where a claim is up to, and says nothing of it once a claim with no position is back', () => {
    const placed = vi.spyOn(navigator.mediaSession, 'setPositionState');
    const pressed = vi.fn();

    claimFor('A song', pressed);

    const film = claimFor('A film', pressed);

    film.setPosition({ duration: 1200, position: 30, playbackRate: 1 });

    expect(placed).toHaveBeenLastCalledWith({ duration: 1200, position: 30, playbackRate: 1 });

    film.release();

    expect(placed).toHaveBeenLastCalledWith(undefined);
  });
});
