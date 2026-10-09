import { beforeEach, describe, expect, it, vi } from 'vitest';

type Item = { label?: string; role?: string; type?: string; click?: () => void };

const buildFromTemplate = vi.fn<(template: Item[]) => object>((template) => ({ template }));

const setContextMenu = vi.fn();

const setToolTip = vi.fn();

const madeWith = vi.fn();

const addRepresentation = vi.fn<(one: { scaleFactor: number }) => void>();

vi.mock('electron', () => ({
  Menu: { buildFromTemplate },
  Tray: class {
    constructor(picture: object) {
      madeWith(picture);
    }

    setContextMenu = setContextMenu;

    setToolTip = setToolTip;
  },
  app: { getAppPath: () => '/app' },
  nativeImage: {
    createFromPath: () => ({ resize: () => ({ toPNG: () => Buffer.from('png') }) }),
    createEmpty: () => ({ addRepresentation }),
  },
}));

const { theTray } = await import('./theTray');

const items = (): Item[] => buildFromTemplate.mock.calls[0]?.[0] ?? [];

beforeEach(() => {
  buildFromTemplate.mockClear();
  setContextMenu.mockClear();
  madeWith.mockClear();
  addRepresentation.mockClear();
});

describe('theTray', () => {
  it('puts nothing in the tray on a Mac, which keeps it in the menu bar', () => {
    expect(theTray(vi.fn(), 'darwin')).toBeNull();
    expect(madeWith).not.toHaveBeenCalled();
  });

  it('offers a check for a release, and a way to quit, on Windows', () => {
    theTray(vi.fn(), 'win32');

    expect(items().map((item) => item.label ?? item.role ?? item.type)).toEqual([
      'Check for updates…',
      'separator',
      'quit',
    ]);
    expect(setContextMenu).toHaveBeenCalledOnce();
  });

  it('checks when that is chosen', () => {
    const checkForUpdates = vi.fn();

    theTray(checkForUpdates, 'linux');
    items()
      .find((item) => item.label === 'Check for updates…')
      ?.click?.();

    expect(checkForUpdates).toHaveBeenCalledOnce();
  });

  it('draws the icon for every scale a screen may ask for', () => {
    theTray(vi.fn(), 'win32');

    expect(addRepresentation.mock.calls.map(([one]) => one.scaleFactor)).toEqual([1, 1.5, 2]);
  });
});
