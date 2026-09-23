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
});
