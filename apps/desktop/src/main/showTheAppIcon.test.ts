import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createFromPath = vi.fn((path: string) => ({ path }));
const theme = { shouldUseDarkColors: false };

vi.mock('electron', () => ({
  app: { getAppPath: () => '/app' },
  nativeImage: { createFromPath },
  nativeTheme: theme,
}));

const { showTheAppIcon } = await import('./showTheAppIcon');

const setIcon = vi.fn();

/**
 * A window as the main process holds it, with only the parts the icon touches.
 *
 * @returns The window.
 */
const aWindow = () => ({ isDestroyed: () => false, setIcon });

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
  setIcon.mockClear();
  createFromPath.mockClear();
  theme.shouldUseDarkColors = false;
});

afterEach(() => {
  runningOn(REAL_PLATFORM);
});

describe('showTheAppIcon', () => {
  it('shows the round icon that follows Windows being in dark mode', () => {
    runningOn('win32');
    theme.shouldUseDarkColors = true;

    showTheAppIcon(aWindow(), null);

    expect(createFromPath).toHaveBeenCalledWith('/app/build/icon-win-dark.png');
    expect(setIcon).toHaveBeenCalledOnce();
  });

  it('shows the icon chosen outright, whatever mode Windows is in', () => {
    runningOn('win32');
    theme.shouldUseDarkColors = true;

    showTheAppIcon(aWindow(), 'light');

    expect(createFromPath).toHaveBeenCalledWith('/app/build/icon-win.png');
  });

  it('leaves other systems alone', () => {
    runningOn('darwin');

    showTheAppIcon(aWindow(), 'dark');

    expect(setIcon).not.toHaveBeenCalled();
  });
});
