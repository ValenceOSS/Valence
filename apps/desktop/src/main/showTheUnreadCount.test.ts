import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setBadgeCount = vi.fn();
const createFromDataURL = vi.fn((url: string) => ({ url }));

vi.mock('electron', () => ({
  app: { setBadgeCount },
  nativeImage: { createFromDataURL },
}));

const { showTheUnreadCount } = await import('./showTheUnreadCount');

const PICTURE = 'data:image/png;base64,AAAA';

const setOverlayIcon = vi.fn();

/**
 * A window as the main process holds it, with only the parts the badge touches.
 *
 * @returns The window.
 */
const aWindow = () => ({ isDestroyed: () => false, setOverlayIcon });

/**
 * Pretends the main process is running on a given system.
 *
 * @param platform - The system.
 */
const runningOn = (platform: NodeJS.Platform): void => {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
};

const REAL_PLATFORM = process.platform;

beforeEach(() => {
  setBadgeCount.mockClear();
  setOverlayIcon.mockClear();
  createFromDataURL.mockClear();
});

afterEach(() => {
  runningOn(REAL_PLATFORM);
});

describe('showTheUnreadCount', () => {
  it('gives the count to the dock on macOS', () => {
    runningOn('darwin');

    showTheUnreadCount(aWindow(), 3, null);

    expect(setBadgeCount).toHaveBeenCalledWith(3);
    expect(setOverlayIcon).not.toHaveBeenCalled();
  });

  it('lays the drawn picture over the taskbar button on Windows, and says what it means', () => {
    runningOn('win32');

    showTheUnreadCount(aWindow(), 3, PICTURE);

    expect(createFromDataURL).toHaveBeenCalledWith(PICTURE);
    expect(setOverlayIcon).toHaveBeenCalledWith({ url: PICTURE }, '3 unread');
    expect(setBadgeCount).not.toHaveBeenCalled();
  });

  it('takes the picture away on Windows once nothing is unread', () => {
    runningOn('win32');

    showTheUnreadCount(aWindow(), 0, null);

    expect(setOverlayIcon).toHaveBeenCalledWith(null, '');
  });

  it('leaves a window that is gone alone', () => {
    runningOn('win32');

    showTheUnreadCount(null, 3, PICTURE);

    expect(setOverlayIcon).not.toHaveBeenCalled();
  });
});
