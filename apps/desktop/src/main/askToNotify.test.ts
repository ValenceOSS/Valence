import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isSupported = vi.fn(() => true);

vi.mock('electron', () => ({ Notification: { isSupported } }));

const { askToNotify } = await import('./askToNotify');

const REAL_PLATFORM = process.platform;

/**
 * Pretends the main process is running on a given system.
 *
 * @param platform - The system.
 */
const runningOn = (platform: NodeJS.Platform): void => {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
};

beforeEach(() => {
  isSupported.mockClear();
});

afterEach(() => {
  runningOn(REAL_PLATFORM);
});

describe('askToNotify', () => {
  it('gets notifications ready on macOS, which is what has it ask', () => {
    runningOn('darwin');

    askToNotify();

    expect(isSupported).toHaveBeenCalledOnce();
  });

  it('leaves other systems alone', () => {
    runningOn('win32');

    askToNotify();

    expect(isSupported).not.toHaveBeenCalled();
  });
});
