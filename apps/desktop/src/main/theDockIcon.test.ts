import { beforeEach, describe, expect, it, vi } from 'vitest';

const setIcon = vi.fn();

let dock: { setIcon: (path: string) => void } | undefined = { setIcon };

let isPackaged = false;

vi.mock('electron', () => ({
  app: {
    getAppPath: () => '/an/app',
    get isPackaged() {
      return isPackaged;
    },
    get dock() {
      return dock;
    },
  },
}));

const { theDockIcon } = await import('./theDockIcon');

beforeEach(() => {
  setIcon.mockClear();
  dock = { setIcon };
  isPackaged = false;
});

describe('theDockIcon', () => {
  it('puts Valence in the dock, which otherwise shows the engine it was run with', () => {
    theDockIcon();

    expect(setIcon).toHaveBeenCalledWith('/an/app/build/icon-dev.png');
  });

  it('asks for nothing once packaged, where the folder it would ask for is not carried', () => {
    isPackaged = true;

    theDockIcon();

    expect(setIcon).not.toHaveBeenCalled();
  });

  it('does nothing where there is no dock, which is everywhere but macOS', () => {
    dock = undefined;

    expect(() => {
      theDockIcon();
    }).not.toThrow();
  });
});
