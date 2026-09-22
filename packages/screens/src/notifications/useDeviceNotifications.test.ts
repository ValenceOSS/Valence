import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { useDeviceNotifications } from './useDeviceNotifications';
import type { Notification } from '@ValenceClient/notifications/fetchNotifications';

const NOTHING_YET: Notification[] = [];

const aNotice = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'a-notice',
  event: 'media.added',
  title: 'Arrival',
  body: 'Added to Films',
  link: null,
  createdAt: '2026-08-10T00:00:00.000Z',
  readAt: null,
  ...overrides,
});

afterEach(() => {
  forgetPlatform();
});

describe('useDeviceNotifications', () => {
  it('keeps the badge count on the platform up to date', () => {
    const setUnreadBadge = vi.fn();

    installPlatform(aFakePlatform({ setUnreadBadge }));

    renderHook(() => useDeviceNotifications({ notifications: [], unread: 3, onOpen: () => {} }));

    expect(setUnreadBadge).toHaveBeenCalledWith(3);
  });

  it('says nothing about the inbox it found already there, which is not news', () => {
    const notifyLocally = vi.fn();

    installPlatform(aFakePlatform({ notifyLocally }));

    renderHook(() =>
      useDeviceNotifications({
        notifications: [aNotice()],
        unread: 1,
        onOpen: () => {},
      }),
    );

    expect(notifyLocally).not.toHaveBeenCalled();
  });

  it('notifies for a notice that arrives after the first look', () => {
    const notifyLocally = vi.fn();

    installPlatform(aFakePlatform({ notifyLocally }));

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({ notifications, unread: notifications.length, onOpen: () => {} }),
      { initialProps: NOTHING_YET },
    );

    rerender([aNotice()]);

    expect(notifyLocally).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Arrival', body: 'Added to Films' }),
    );
  });

  it('says nothing for a notice that arrived already read, from another device', () => {
    const notifyLocally = vi.fn();

    installPlatform(aFakePlatform({ notifyLocally }));

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({ notifications, unread: 0, onOpen: () => {} }),
      { initialProps: NOTHING_YET },
    );

    rerender([aNotice({ readAt: '2026-08-10T00:01:00.000Z' })]);

    expect(notifyLocally).not.toHaveBeenCalled();
  });

  it('says nothing twice for the same notice arriving again unchanged', () => {
    const notifyLocally = vi.fn();

    installPlatform(aFakePlatform({ notifyLocally }));

    const notice = aNotice();

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({ notifications, unread: notifications.length, onOpen: () => {} }),
      { initialProps: NOTHING_YET },
    );

    rerender([notice]);
    rerender([notice]);

    expect(notifyLocally).toHaveBeenCalledOnce();
  });

  it('leads to where the notice points once it is pressed', () => {
    const onOpen = vi.fn();
    let opened: (() => void) | undefined;

    installPlatform(
      aFakePlatform({
        notifyLocally: (notice) => {
          opened = notice.onOpen;
        },
      }),
    );

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({ notifications, unread: notifications.length, onOpen }),
      { initialProps: NOTHING_YET },
    );

    rerender([aNotice({ link: '/films/a-film' })]);

    opened?.();

    expect(onOpen).toHaveBeenCalledWith('/films/a-film');
  });
});
