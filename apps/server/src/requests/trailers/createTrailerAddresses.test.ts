import { describe, expect, it, vi } from 'vitest';
import { createTrailerAddresses } from './createTrailerAddresses';
import type { TrailerAnswer } from './TrailerAnswer';

const FOUND = 'https://manifest.googlevideo.com/api/manifest/hls_variant/expire/2000/id/1';

/**
 * Addresses for a test: a clock that starts at nothing, no pause between prepared titles, and an
 * ask that answers as it is told.
 *
 * @param answer - What asking yt-dlp answers.
 * @returns The addresses, the ask and a way to move the clock on.
 */
const someAddresses = (answer: TrailerAnswer = { kind: 'found', url: FOUND }) => {
  let at = 0;
  const ask = vi.fn(() => Promise.resolve(answer));
  const onProblem = vi.fn();
  const addresses = createTrailerAddresses({
    ask,
    now: () => at,
    wait: () => Promise.resolve(),
    onProblem,
  });

  return {
    addresses,
    ask,
    onProblem,
    pass: (ms: number) => {
      at += ms;
    },
  };
};

const ARRIVAL = () => Promise.resolve('dQw4w9WgXcQ');

describe('createTrailerAddresses', () => {
  it('asks once for a title opened twice', async () => {
    const { addresses, ask } = someAddresses();

    expect(await addresses.find('film:329865', ARRIVAL)).toBe(FOUND);
    expect(await addresses.find('film:329865', ARRIVAL)).toBe(FOUND);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('shares one lookup between pages asking at the same moment', async () => {
    const { addresses, ask } = someAddresses();

    await Promise.all([
      addresses.find('film:329865', ARRIVAL),
      addresses.find('film:329865', ARRIVAL),
    ]);

    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('asks again shortly before the address YouTube gave expires', async () => {
    const { addresses, ask, pass } = someAddresses();

    await addresses.find('film:329865', ARRIVAL);
    pass(2_000_000 - 10 * 60 * 1000);
    await addresses.find('film:329865', ARRIVAL);

    expect(ask).toHaveBeenCalledTimes(2);
  });

  it('remembers for a day that a trailer could not be found, and says why', async () => {
    const { addresses, ask, onProblem, pass } = someAddresses({
      kind: 'failed',
      why: 'Sign in to confirm you are not a bot',
    });

    expect(await addresses.find('film:329865', ARRIVAL)).toBeNull();
    pass(23 * 60 * 60 * 1000);
    expect(await addresses.find('film:329865', ARRIVAL)).toBeNull();

    expect(ask).toHaveBeenCalledTimes(1);
    expect(onProblem).toHaveBeenCalledWith('dQw4w9WgXcQ', 'Sign in to confirm you are not a bot');
  });

  it('does not ask YouTube about a title with no trailer', async () => {
    const { addresses, ask } = someAddresses();

    expect(await addresses.find('film:1', () => Promise.resolve(null))).toBeNull();
    expect(ask).not.toHaveBeenCalled();
  });

  it('asks again for an address that has been forgotten', async () => {
    const { addresses, ask } = someAddresses();

    await addresses.find('film:329865', ARRIVAL);
    addresses.forget('film:329865');
    await addresses.find('film:329865', ARRIVAL);

    expect(ask).toHaveBeenCalledTimes(2);
  });

  it('measures how the picture sits in its frame once, and keeps it', async () => {
    const framing = { wide: 640, high: 360, top: 44, right: 0, bottom: 44, left: 0 };
    const measure = vi.fn(() => Promise.resolve(framing));
    const addresses = createTrailerAddresses({
      ask: () => Promise.resolve({ kind: 'found', url: FOUND }),
      measure,
      now: () => 0,
    });

    await addresses.find('film:329865', ARRIVAL);
    addresses.forget('film:329865');
    await addresses.find('film:329865', ARRIVAL);

    await vi.waitFor(() => {
      expect(addresses.framingOf('film:329865')).toEqual(framing);
    });
    expect(measure).toHaveBeenCalledTimes(1);
  });

  it('looks up no more than two trailers at once', async () => {
    let running = 0;
    let most = 0;
    const releases: (() => void)[] = [];
    const ask = vi.fn(
      () =>
        new Promise<TrailerAnswer>((resolve) => {
          running += 1;
          most = Math.max(most, running);
          releases.push(() => {
            running -= 1;
            resolve({ kind: 'found', url: FOUND });
          });
        }),
    );
    const addresses = createTrailerAddresses({ ask, now: () => 0 });
    const asked = ['film:1', 'film:2', 'film:3', 'film:4'].map((title) =>
      addresses.find(title, ARRIVAL),
    );

    await vi.waitFor(() => {
      expect(ask).toHaveBeenCalledTimes(2);
    });

    for (
      let turn = 0;
      turn < 200 && (releases.length > 0 || ask.mock.calls.length < 4);
      turn += 1
    ) {
      releases.shift()?.();
      await Promise.resolve();
    }

    await Promise.all(asked);

    expect(most).toBe(2);
    expect(ask).toHaveBeenCalledTimes(4);
  });

  it('carries on preparing past a title whose lookup fails', async () => {
    const { addresses, ask } = someAddresses();

    addresses.prepare([
      { title: 'film:1', readYouTubeId: () => Promise.reject(new Error('the catalogue is down')) },
      { title: 'film:2', readYouTubeId: ARRIVAL },
    ]);

    await vi.waitFor(() => {
      expect(ask).toHaveBeenCalledTimes(1);
    });
  });

  it('prepares titles ahead, one at a time, skipping those already known', async () => {
    const { addresses, ask } = someAddresses();

    await addresses.find('film:1', ARRIVAL);
    addresses.prepare([
      { title: 'film:1', readYouTubeId: ARRIVAL },
      { title: 'film:2', readYouTubeId: ARRIVAL },
      { title: 'series:3', readYouTubeId: ARRIVAL },
    ]);

    await vi.waitFor(() => {
      expect(ask).toHaveBeenCalledTimes(3);
    });
  });
});
