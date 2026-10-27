import { describe, expect, it, vi } from 'vitest';
import { aStartedSession } from '@ValenceClient/testing/aStartedSession';
import { createReadiedEpisode } from './createReadiedEpisode';
import type { ReadiedChoices, ReadiedStart } from './createReadiedEpisode';

const NEXT: ReadiedChoices = {
  mediaId: 'episode-2',
  startSeconds: 0,
  audioStreamIndex: undefined,
  subtitleStreamIndex: undefined,
  quality: 'auto',
};

const started = (sessionId: string, choices = NEXT): Promise<ReadiedStart> =>
  Promise.resolve({ choices, outcome: { kind: 'started', session: aStartedSession(sessionId) } });

const aKeeper = (nowMs = 0) => {
  const beats: (() => void)[] = [];
  const stopsBeating = vi.fn();
  const needs = {
    stop: vi.fn(),
    beat: vi.fn(),
    now: vi.fn(() => nowMs),
    every: vi.fn((run: () => void) => {
      beats.push(run);

      return stopsBeating;
    }),
  };

  return { keeper: createReadiedEpisode(needs), needs, beats, stopsBeating };
};

const settled = () => new Promise((done) => setTimeout(done, 0));

describe('createReadiedEpisode', () => {
  it('hands the session made ready to the episode starting with the same choices', async () => {
    const { keeper, needs } = aKeeper();

    keeper.readyAhead('episode-2', () => started('next'));
    await settled();

    expect(keeper.take(NEXT)?.sessionId).toBe('next');
    expect(needs.stop).not.toHaveBeenCalled();
    expect(keeper.take(NEXT)).toBeNull();
  });

  it('keeps the session alive while it waits, and stops once it is handed over', async () => {
    const { keeper, needs, beats, stopsBeating } = aKeeper();

    keeper.readyAhead('episode-2', () => started('next'));
    await settled();
    beats[0]?.();

    expect(needs.beat).toHaveBeenCalledWith('next');

    keeper.take(NEXT);

    expect(stopsBeating).toHaveBeenCalled();
  });

  it('stops a session made with other choices rather than handing it over', async () => {
    const { keeper, needs } = aKeeper();

    keeper.readyAhead('episode-2', () => started('next'));
    await settled();

    expect(keeper.take({ ...NEXT, audioStreamIndex: 2 })).toBeNull();
    expect(needs.stop).toHaveBeenCalledWith('next');
  });

  it('stops a session that waited too long', async () => {
    const { keeper, needs } = aKeeper();

    keeper.readyAhead('episode-2', () => started('next'));
    await settled();
    needs.now.mockReturnValue(11 * 60 * 1000);

    expect(keeper.take(NEXT)).toBeNull();
    expect(needs.stop).toHaveBeenCalledWith('next');
  });

  it('starts only one session however often it is asked for the same episode', async () => {
    const { keeper } = aKeeper();
    const start = vi.fn(() => started('next'));

    keeper.readyAhead('episode-2', start);
    keeper.readyAhead('episode-2', start);
    await settled();

    expect(start).toHaveBeenCalledTimes(1);
    expect(keeper.isReadyingFor('episode-2')).toBe(true);
  });

  it('lets go of the last one made ready on being asked for another episode', async () => {
    const { keeper, needs } = aKeeper();

    keeper.readyAhead('episode-2', () => started('next'));
    await settled();
    keeper.readyAhead('episode-3', () => started('after', { ...NEXT, mediaId: 'episode-3' }));

    expect(needs.stop).toHaveBeenCalledWith('next');
  });

  it('stops a session dropped before the server answered, once it does', async () => {
    const { keeper, needs } = aKeeper();

    keeper.readyAhead('episode-2', () => started('next'));
    keeper.drop();
    await settled();

    expect(needs.stop).toHaveBeenCalledWith('next');
    expect(keeper.isReadyingFor('episode-2')).toBe(false);
  });

  it('hands nothing over while the server has not answered yet', () => {
    const { keeper } = aKeeper();

    keeper.readyAhead('episode-2', () => new Promise(() => undefined));

    expect(keeper.take(NEXT)).toBeNull();
  });

  it('holds nothing where the server would not start the session', async () => {
    const { keeper } = aKeeper();

    keeper.readyAhead('episode-2', () =>
      Promise.resolve({
        choices: NEXT,
        outcome: { kind: 'failed', reason: 'busy', problem: 'tooManyStreams' },
      }),
    );
    await settled();

    expect(keeper.isReadyingFor('episode-2')).toBe(false);
  });
});
