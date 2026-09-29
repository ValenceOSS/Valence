import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { installDesktopPlatform } from './installDesktopPlatform';

const onDisk = new Map<string, string>();

const kept: never[] = [];

const aBridge = (isReachable = true) => ({
  preferences: {
    held: Object.freeze(Object.fromEntries(onDisk)),
    write: (key: string, value: string) => {
      onDisk.set(key, value);
    },
    forget: (key: string) => {
      onDisk.delete(key);
    },
  },
  held: {
    all: () => Promise.resolve(kept),
    keep: () => Promise.resolve(),
    drop: () => Promise.resolve(),
    pause: () => Promise.resolve(),
    whenChanged: () => () => {},
  },
  reach: {
    now: () => isReachable,
    whenChanged: () => () => {},
  },
});

beforeEach(() => {
  forgetPlatform();
  onDisk.clear();
  vi.stubGlobal('valence', aBridge());
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('installDesktopPlatform', () => {
  it('leaves the application able to say what it is running on', () => {
    expect(() => platformInUse()).toThrow();

    installDesktopPlatform();

    expect(() => platformInUse()).not.toThrow();
  });

  it('writes the address down where the process that owns the window will read it', () => {
    installDesktopPlatform();

    platformInUse().store.write('valence.server.address', 'https://valence.example.com');

    expect(onDisk.get('valence.server.address')).toBe('https://valence.example.com');
  });

  it('names the machine rather than the engine, so a sessions list reads like a household', () => {
    installDesktopPlatform();

    expect(platformInUse().describeThisClient()).toContain('Valence');
  });

  it('opens no socket, since this page is gone before anything live would matter', () => {
    installDesktopPlatform();

    const link = platformInUse().openSocket({
      onOpen: () => {},
      onMessage: () => {},
      onClose: () => {},
    });

    expect(() => {
      link.send('anything');
      link.close();
    }).not.toThrow();
  });

  it('is the same running client however often it is asked', () => {
    installDesktopPlatform();

    expect(platformInUse().thisClientId()).toBe(platformInUse().thisClientId());
  });

  it('is the desktop client whatever Electron says its user agent is', () => {
    installDesktopPlatform();

    expect(platformInUse().thisClientKind()).toBe('desktop');
  });

  it('can be trusted with a file somebody means to keep, unlike a browser', () => {
    installDesktopPlatform();

    expect(platformInUse().canKeepFiles()).toBe(true);
  });

  it('asks the process that owns the disk what is on it', async () => {
    installDesktopPlatform();

    await expect(platformInUse().held.all()).resolves.toEqual([]);
  });

  it('points the player at this client rather than at a server', () => {
    installDesktopPlatform();

    expect(platformInUse().held.sourceFor('a-download')).toBe('/held/a-download');
  });

  it('reads the thumbnails kept beside a film from this client', async () => {
    const fetching = vi.fn((address: string) =>
      Promise.resolve(
        new Response(
          address.endsWith('thumbnails.vtt')
            ? 'WEBVTT\n\n00:00:00.000 --> 00:00:10.000\nsheet-001.jpg#xywh=0,0,320,180\n'
            : 'gone',
        ),
      ),
    );

    vi.stubGlobal('fetch', fetching);
    installDesktopPlatform();

    const kept = await platformInUse().held.trickplayFor('a-download');

    expect(fetching).toHaveBeenCalledWith('/held/a-download/trickplay/thumbnails.vtt');
    expect(kept?.thumbnails[0]?.sheetUrl).toBe('/held/a-download/trickplay/sheet-001.jpg');
  });

  it('finds no thumbnails where none were kept', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('gone', { status: 404 })));
    installDesktopPlatform();

    await expect(platformInUse().held.trickplayFor('a-download')).resolves.toBeNull();
  });

  it('takes what the process that does the asking says about reach', () => {
    vi.stubGlobal('valence', aBridge(false));

    installDesktopPlatform();

    expect(platformInUse().reachability.isReachable()).toBe(false);
  });

  it('asks again rather than answering from what it was told first', () => {
    let isReachable = false;

    vi.stubGlobal('valence', {
      ...aBridge(),
      reach: { now: () => isReachable, whenChanged: () => () => {} },
    });

    installDesktopPlatform();

    expect(platformInUse().reachability.isReachable()).toBe(false);

    isReachable = true;

    expect(platformInUse().reachability.isReachable()).toBe(true);
  });
});
