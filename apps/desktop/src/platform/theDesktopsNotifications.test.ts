import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifyLocally, setUnreadBadge } from './theDesktopsNotifications';

const ShownNotification = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
  ShownNotification.mockClear();
});

describe('notifyLocally', () => {
  it('shows a notice with the title and the body it was given', () => {
    vi.stubGlobal(
      'Notification',
      class {
        constructor(title: string, options: { body: string }) {
          ShownNotification(title, options.body);
        }
      },
    );

    notifyLocally({ title: 'Arrival', body: 'Added to Films' });

    expect(ShownNotification).toHaveBeenCalledWith('Arrival', 'Added to Films');
  });

  it('brings the window forward and leads to where the notice points once it is pressed', () => {
    const onOpen = vi.fn();
    const shown: { onclick: (() => void) | null }[] = [];

    class FakeNotification {
      onclick: (() => void) | null = null;

      constructor() {
        shown.push(this);
      }
    }

    const focused = vi.fn();

    vi.stubGlobal('Notification', FakeNotification);
    vi.stubGlobal('focus', focused);

    notifyLocally({ title: 'Arrival', body: 'Added to Films', onOpen });

    shown[0]?.onclick?.();

    expect(focused).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('leads nowhere where nothing was asked to happen on a press', () => {
    vi.stubGlobal(
      'Notification',
      class {
        onclick: (() => void) | null = null;
      },
    );

    expect(() => {
      notifyLocally({ title: 'Arrival', body: 'Added to Films' });
    }).not.toThrow();
  });
});

describe('setUnreadBadge', () => {
  it('asks the process that owns the icon to draw the count', () => {
    const setBadge = vi.fn();

    vi.stubGlobal('valence', { notifications: { setBadge } });

    setUnreadBadge(3);

    expect(setBadge).toHaveBeenCalledWith(3);
  });
});
