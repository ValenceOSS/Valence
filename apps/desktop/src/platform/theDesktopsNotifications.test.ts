import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { notifyLocally, setUnreadBadge } from './theDesktopsNotifications';

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(isPermissionGranted).mockReset();
  vi.mocked(requestPermission).mockReset();
  vi.mocked(sendNotification).mockReset();
});

describe('notifyLocally', () => {
  it('shows a notice with the title and the body it was given, where notices are allowed', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(true);

    notifyLocally({ title: 'Arrival', body: 'Added to Films' });

    await vi.waitFor(() => {
      expect(sendNotification).toHaveBeenCalledWith({ title: 'Arrival', body: 'Added to Films' });
    });
    expect(requestPermission).not.toHaveBeenCalled();
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
});

describe('setUnreadBadge', () => {
  it('asks the host that owns the icon to draw the count', () => {
    const setBadge = vi.fn();

    vi.stubGlobal('valence', { notifications: { setBadge } });

    setUnreadBadge(3);

    expect(setBadge).toHaveBeenCalledWith(3);
  });
});
