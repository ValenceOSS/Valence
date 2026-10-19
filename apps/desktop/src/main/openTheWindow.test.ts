import { beforeEach, describe, expect, it, vi } from 'vitest';

const show = vi.fn();

let drawn: () => void = () => undefined;

vi.mock('electron', () => ({
  app: { getAppPath: () => '/app', isPackaged: true },
  shell: { openExternal: vi.fn() },
  BrowserWindow: class {
    webContents = { setWindowOpenHandler: vi.fn(), on: vi.fn() };

    show = show;

    isDestroyed = () => false;

    once(_event: 'ready-to-show', listener: () => void) {
      drawn = listener;
    }
  },
}));

vi.mock('@ValenceDesktop/main/serveTheApplication', () => ({ ORIGIN: 'valence://app' }));

const { openTheWindow } = await import('./openTheWindow');

beforeEach(() => {
  show.mockClear();
});

describe('openTheWindow', () => {
  it('shows the window once its page has drawn', async () => {
    openTheWindow();
    drawn();

    await vi.waitFor(() => {
      expect(show).toHaveBeenCalledOnce();
    });
  });

  it('waits for what it is told to before showing, so the update window is seen first', async () => {
    let letItShow: () => void = () => undefined;

    openTheWindow(
      new Promise<void>((resolve) => {
        letItShow = resolve;
      }),
    );
    drawn();
    await Promise.resolve();

    expect(show).not.toHaveBeenCalled();

    letItShow();

    await vi.waitFor(() => {
      expect(show).toHaveBeenCalledOnce();
    });
  });
});
