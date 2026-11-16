import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { listen } from '@tauri-apps/api/event';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { fakeTheHostsEvents } from '@ValenceDesktop/testing/fakeTheHostsEvents';
import { notifyLocally, setUnreadBadge } from './theDesktopsNotifications';

vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));

const OPENED = 'valence:notice-opened';

let host = fakeTheHostsEvents();

beforeAll(() => {
  host = fakeTheHostsEvents();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(isPermissionGranted).mockReset();
  vi.mocked(requestPermission).mockReset();
  vi.mocked(sendNotification).mockReset();
});

/**
 * Puts a notice up where notices are allowed, and reads back the number it was shown under.
 *
 * @param onOpen - What to do once it is clicked.
 * @returns The number the host would name it by.
 */
const aNoticeShown = async (onOpen?: () => void): Promise<number> => {
  vi.mocked(isPermissionGranted).mockResolvedValue(true);
  vi.mocked(sendNotification).mockClear();

  notifyLocally({ title: 'Arrival', body: 'Added to Films', ...(onOpen ? { onOpen } : {}) });

  await vi.waitFor(() => {
    expect(sendNotification).toHaveBeenCalledOnce();
  });

  const shown = vi.mocked(sendNotification).mock.calls[0]?.[0];

  return typeof shown === 'object' && typeof shown.id === 'number' ? shown.id : -1;
};

describe('notifyLocally', () => {
  it('shows a notice with the title and the body it was given, where notices are allowed', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(true);

    notifyLocally({ title: 'Arrival', body: 'Added to Films' });

    await vi.waitFor(() => {
      expect(sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Arrival', body: 'Added to Films' }),
      );
    });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('numbers each notice with a whole number the host can carry', async () => {
    const id = await aNoticeShown();

    expect(Number.isInteger(id)).toBe(true);
    expect(id).toBeGreaterThanOrEqual(0);
    expect(id).toBeLessThan(2 ** 31);
  });

  it('asks to show notices where it has not been allowed yet, and shows it once it is', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(false);
    vi.mocked(requestPermission).mockResolvedValue('granted');

    notifyLocally({ title: 'Arrival', body: 'Added to Films' });

    await vi.waitFor(() => {
      expect(sendNotification).toHaveBeenCalledOnce();
    });
  });

  it('shows nothing where somebody refused notices', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(false);
    vi.mocked(requestPermission).mockResolvedValue('denied');

    notifyLocally({ title: 'Arrival', body: 'Added to Films' });

    await vi.waitFor(() => {
      expect(requestPermission).toHaveBeenCalledOnce();
    });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('keeps quiet where the host could not be asked', async () => {
    vi.mocked(isPermissionGranted).mockRejectedValue(new Error('no host'));

    expect(() => {
      notifyLocally({ title: 'Arrival', body: 'Added to Films' });
    }).not.toThrow();

    await vi.waitFor(() => {
      expect(isPermissionGranted).toHaveBeenCalledOnce();
    });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('opens what a notice was about once the host says it was clicked, and only once', async () => {
    const onOpen = vi.fn();
    const id = await aNoticeShown(onOpen);

    await vi.waitFor(() => {
      expect(host.listening(OPENED)).toBe(1);
    });
    host.emit(OPENED, id);
    host.emit(OPENED, id);

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('opens nothing for a notice it did not put up, or for what is not a notice', async () => {
    const onOpen = vi.fn();
    const id = await aNoticeShown(onOpen);

    host.emit(OPENED, id + 1);
    host.emit(OPENED, String(id));
    host.emit(OPENED, null);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('listens for clicks only once, however many notices it puts up', async () => {
    await aNoticeShown(vi.fn());
    await aNoticeShown(vi.fn());

    expect(host.listening(OPENED)).toBe(1);
    expect(listen).toHaveBeenCalledOnce();
  });

  it('forgets the oldest notices once it holds more than anybody goes back to', async () => {
    const first = vi.fn();
    const firstId = await aNoticeShown(first);
    const later = [];

    for (let shown = 0; shown < 50; shown += 1) {
      const onOpen = vi.fn();

      later.push({ id: await aNoticeShown(onOpen), onOpen });
    }

    host.emit(OPENED, firstId);
    for (const { id } of later) {
      host.emit(OPENED, id);
    }

    expect(first).not.toHaveBeenCalled();
    for (const { onOpen } of later) {
      expect(onOpen).toHaveBeenCalledOnce();
    }
  });
});

describe('setUnreadBadge', () => {
  it('asks the host that owns the icon to draw the count', () => {
    const setBadge = vi.fn();

    vi.stubGlobal('valence', { notifications: { setBadge } });

    setUnreadBadge(3);

    expect(setBadge).toHaveBeenCalledWith(3);
  });
});
