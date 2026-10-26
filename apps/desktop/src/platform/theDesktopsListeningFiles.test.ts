import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { theDesktopsListeningFiles } from './theDesktopsListeningFiles';

/**
 * Stands in for what the preload hands the window, answering a fetch only once told to.
 *
 * @returns The bridge, a way to say how far a fetch has got, a way to finish it, and how many are
 * hearing progress.
 */
const aBridge = () => {
  const hearing = new Set<(progress: JsonValue) => void>();
  let finish: (outcome: JsonValue) => void = () => {};

  const listening = {
    fetch: vi.fn(
      (_from: string, _name: string) =>
        new Promise<JsonValue>((settle) => {
          finish = settle;
        }),
    ),
    stop: vi.fn(() => Promise.resolve()),
    drop: vi.fn(() => Promise.resolve()),
    has: vi.fn(() => Promise.resolve(true)),
    whenProgress: (listener: (progress: JsonValue) => void) => {
      hearing.add(listener);

      return () => {
        hearing.delete(listener);
      };
    },
  };

  vi.stubGlobal('valence', { listening });

  return {
    listening,
    say: (progress: JsonValue) => {
      for (const listener of hearing) {
        listener(progress);
      }
    },
    finish: (outcome: JsonValue) => {
      finish(outcome);
    },
    hearing: () => hearing.size,
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('theDesktopsListeningFiles', () => {
  it('asks the process that owns the disk to fetch the file, and says how it went', async () => {
    const bridge = aBridge();
    const fetched = theDesktopsListeningFiles().fetch('/api/a', 'track-a-high.m4a', () => {});

    bridge.finish({ bytes: 6, isComplete: true, failure: null });

    await expect(fetched).resolves.toEqual({ bytes: 6, isComplete: true, failure: null });
    expect(bridge.listening.fetch).toHaveBeenCalledWith('/api/a', 'track-a-high.m4a');
  });

  it('passes on how far its own file has got, and nobody else’s', async () => {
    const bridge = aBridge();
    const report = vi.fn();
    const fetched = theDesktopsListeningFiles().fetch('/api/a', 'track-a-high.m4a', report);

    bridge.say({ name: 'track-b-high.m4a', bytes: 9, ofBytes: 10 });
    bridge.say({ name: 'track-a-high.m4a', bytes: 3, ofBytes: null });
    bridge.say('nonsense');
    bridge.finish({ bytes: 6, isComplete: true, failure: null });
    await fetched;

    expect(report.mock.calls).toEqual([[3, null]]);
  });

  it('stops hearing how far it has got once it is over', async () => {
    const bridge = aBridge();
    const fetched = theDesktopsListeningFiles().fetch('/api/a', 'track-a-high.m4a', () => {});

    expect(bridge.hearing()).toBe(1);

    bridge.finish({ bytes: 6, isComplete: true, failure: null });
    await fetched;

    expect(bridge.hearing()).toBe(0);
  });

  it('reads an answer it cannot make sense of as a failed download', async () => {
    const bridge = aBridge();
    const fetched = theDesktopsListeningFiles().fetch('/api/a', 'track-a-high.m4a', () => {});

    bridge.finish('nonsense');

    await expect(fetched).resolves.toEqual({
      bytes: 0,
      isComplete: false,
      failure: 'Download failed',
    });
  });

  it('hands stopping, letting go and asking straight to the process that owns the disk', async () => {
    const bridge = aBridge();
    const files = theDesktopsListeningFiles();

    await files.stop('track-a-high.m4a');
    await files.drop('track-a-high.m4a');

    await expect(files.has('track-a-high.m4a')).resolves.toBe(true);
    expect([bridge.listening.stop.mock.calls, bridge.listening.drop.mock.calls]).toEqual([
      [['track-a-high.m4a']],
      [['track-a-high.m4a']],
    ]);
  });

  it('plays a kept file from this client rather than from a server', () => {
    aBridge();

    expect(theDesktopsListeningFiles().addressOf('track-a-high.m4a')).toBe(
      '/held/listening/track-a-high.m4a',
    );
  });
});
