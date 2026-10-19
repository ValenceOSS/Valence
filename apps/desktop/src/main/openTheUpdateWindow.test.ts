import { beforeEach, describe, expect, it, vi } from 'vitest';

type Options = { x?: number; y?: number; width?: number; height?: number; show?: boolean };

const made = vi.fn<(options: Options) => void>();

const loadURL = vi.fn<(url: string) => Promise<void>>(() => Promise.resolve());

const show = vi.fn();

const getDisplayMatching = vi.fn(() => ({
  workArea: { x: 1920, y: 0, width: 2560, height: 1415 },
}));

vi.mock('electron', () => ({
  app: { getAppPath: () => '/app', isPackaged: true },
  BrowserWindow: class {
    constructor(options: Options) {
      made(options);
    }

    loadURL = loadURL;

    show = show;

    once(_event: 'ready-to-show', listener: () => void) {
      queueMicrotask(listener);
    }
  },
  screen: {
    getPrimaryDisplay: () => ({ workArea: { x: 0, y: 25, width: 1512, height: 920 } }),
    getDisplayMatching,
  },
}));

vi.mock('@ValenceDesktop/main/serveTheApplication', () => ({ ORIGIN: 'valence://app' }));

const { openTheUpdateWindow } = await import('./openTheUpdateWindow');

beforeEach(() => {
  made.mockClear();
  loadURL.mockClear();
  show.mockClear();
});

describe('openTheUpdateWindow', () => {
  it('opens the page for the step it is at, with the version it is installing', async () => {
    await openTheUpdateWindow('installing', '1.5.0');

    expect(loadURL).toHaveBeenCalledWith('valence://app/update.html?step=installing&version=1.5.0');
  });

  it('sits in the true middle of the main screen when there is no main window', async () => {
    await openTheUpdateWindow('finishing', '1.5.0');

    expect(made).toHaveBeenCalledWith(expect.objectContaining({ x: 606, y: 315 }));
  });

  it('opens on the screen the main window was on', async () => {
    const over = { x: 2000, y: 100, width: 1280, height: 800 };

    await openTheUpdateWindow('installing', '1.5.0', over);

    expect(getDisplayMatching).toHaveBeenCalledWith(over);
    expect(made).toHaveBeenCalledWith(expect.objectContaining({ x: 3050, y: 538 }));
  });

  it('is held back until its page has drawn, and settles once it is showing', async () => {
    await openTheUpdateWindow('installing', '1.5.0');

    expect(made).toHaveBeenCalledWith(expect.objectContaining({ show: false }));
    expect(show).toHaveBeenCalledOnce();
  });
});
