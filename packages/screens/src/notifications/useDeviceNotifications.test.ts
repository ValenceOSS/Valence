import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { chooseDeviceNotices } from '@ValenceClient/notifications/deviceNotices';
import { useDeviceNotifications } from './useDeviceNotifications';
import type { LocalNotice } from '@ValenceClient/platform/Platform.types';
import type { Notification } from '@ValenceClient/notifications/fetchNotifications';

const NOTHING_YET: Notification[] = [];

const aNotice = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'a-notice',
  event: 'media.added',
  title: sayVerbatim('Arrival'),
  body: sayVerbatim('Added to Films'),
  link: null,
  createdAt: '2026-08-10T00:00:00.000Z',
  readAt: null,
  ...overrides,
});

afterEach(() => {
  forgetPlatform();
});

/**
 * Installs a platform that records its notices, with this device's notices turned on as asked.
 *
 * @param notifyLocally - What records each notice.
 * @param areOn - Whether this device's notices are on.
 */
const installANoticingPlatform = (notifyLocally: (notice: LocalNotice) => void, areOn = true) => {
  installPlatform(aFakePlatform({ notifyLocally }));
  chooseDeviceNotices(areOn);
};

describe('useDeviceNotifications', () => {
  it('keeps the badge count on the platform up to date', () => {
    const setUnreadBadge = vi.fn();

    installPlatform(aFakePlatform({ setUnreadBadge }));

    renderHook(() =>
      useDeviceNotifications({ isKnown: true, notifications: [], unread: 3, onOpen: () => {} }),
    );

    expect(setUnreadBadge).toHaveBeenCalledWith(3);
  });

  it('says nothing about the inbox it found already there, which is not news', () => {
    const notifyLocally = vi.fn();

    installANoticingPlatform(notifyLocally);

    renderHook(() =>
      useDeviceNotifications({
        isKnown: true,
        notifications: [aNotice()],
        unread: 1,
        onOpen: () => {},
      }),
    );

    expect(notifyLocally).not.toHaveBeenCalled();
  });

  it('says nothing about what was waiting when the inbox arrives after an empty first look', () => {
    const notifyLocally = vi.fn();

    installANoticingPlatform(notifyLocally);

    const { rerender } = renderHook(
      ({ isKnown, notifications }: { isKnown: boolean; notifications: Notification[] }) =>
        useDeviceNotifications({
          isKnown,
          notifications,
          unread: notifications.length,
          onOpen: () => {},
        }),
      { initialProps: { isKnown: false, notifications: NOTHING_YET } },
    );

    rerender({ isKnown: true, notifications: [aNotice()] });

    expect(notifyLocally).not.toHaveBeenCalled();

    rerender({ isKnown: true, notifications: [aNotice(), aNotice({ id: 'another' })] });

    expect(notifyLocally).toHaveBeenCalledTimes(1);
  });

  it('puts nothing up while this device has its notices off', () => {
    const notifyLocally = vi.fn();

    installANoticingPlatform(notifyLocally, false);

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({
          isKnown: true,
          notifications,
          unread: notifications.length,
          onOpen: () => {},
        }),
      { initialProps: NOTHING_YET },
    );

    rerender([aNotice()]);

    expect(notifyLocally).not.toHaveBeenCalled();
  });

  it('notifies for a notice that arrives after the first look', () => {
    const notifyLocally = vi.fn();

    installANoticingPlatform(notifyLocally);

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({
          isKnown: true,
          notifications,
          unread: notifications.length,
          onOpen: () => {},
        }),
      { initialProps: NOTHING_YET },
    );

    rerender([aNotice()]);

    expect(notifyLocally).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Arrival', body: 'Added to Films' }),
    );
  });

  it('says nothing for a notice that arrived already read, from another device', () => {
    const notifyLocally = vi.fn();

    installANoticingPlatform(notifyLocally);

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({ isKnown: true, notifications, unread: 0, onOpen: () => {} }),
      { initialProps: NOTHING_YET },
    );

    rerender([aNotice({ readAt: '2026-08-10T00:01:00.000Z' })]);

    expect(notifyLocally).not.toHaveBeenCalled();
  });

  it('says nothing twice for the same notice arriving again unchanged', () => {
    const notifyLocally = vi.fn();

    installANoticingPlatform(notifyLocally);

    const notice = aNotice();

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({
          isKnown: true,
          notifications,
          unread: notifications.length,
          onOpen: () => {},
        }),
      { initialProps: NOTHING_YET },
    );

    rerender([notice]);
    rerender([notice]);

    expect(notifyLocally).toHaveBeenCalledOnce();
  });

  it('hands over the notice that was pressed, to be opened and taken off the bell', () => {
    const onOpen = vi.fn<(notification: Notification) => void>();
    let opened: (() => void) | undefined;

    installANoticingPlatform((notice) => {
      opened = notice.onOpen;
    });

    const { rerender } = renderHook(
      (notifications: Notification[]) =>
        useDeviceNotifications({
          isKnown: true,
          notifications,
          unread: notifications.length,
          onOpen,
        }),
      { initialProps: NOTHING_YET },
    );

    rerender([aNotice({ link: '/films/a-film' })]);

    opened?.();

    expect(onOpen.mock.calls[0]?.[0]?.link).toBe('/films/a-film');
  });
});
