import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Notification } from '@ValenceContracts/schemas/Notification';
import { NotificationList } from './NotificationList';
import type { NotificationListProps } from './NotificationList.types';

const aNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  event: 'media.added',
  title: sayVerbatim('Something new to watch'),
  body: sayVerbatim('12 episodes — The Office'),
  link: '/?show=s1',
  createdAt: new Date().toISOString(),
  readAt: null,
  ...overrides,
});

const READ = aNotification({
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
  title: sayVerbatim('Scan finished'),
  link: null,
  readAt: new Date().toISOString(),
});

const draw = (overrides: Partial<NotificationListProps> = {}) => {
  const props = {
    notifications: [aNotification(), READ],
    unread: 1,
    onRead: vi.fn(),
    onReadAll: vi.fn(),
    onClearAll: vi.fn(),
    onFollow: vi.fn(),
    ...overrides,
  };

  render(<NotificationList {...props} />);

  return { ...props, user: userEvent.setup() };
};

describe('NotificationList', () => {
  it('is a card headed by what it is, listing what happened under the day it arrived', () => {
    draw();

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Something new to watch')).toBeInTheDocument();
    expect(screen.getByText('Scan finished')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows only what has not been read a tab away', async () => {
    const { user } = draw();

    await user.click(screen.getByRole('tab', { name: 'Unread' }));

    expect(screen.getByText('Something new to watch')).toBeInTheDocument();
    expect(screen.queryByText('Scan finished')).toBeNull();
  });

  it('says everything has been read when nothing is left unread', async () => {
    const { user } = draw({ notifications: [READ], unread: 0 });

    await user.click(screen.getByRole('tab', { name: 'Unread' }));

    expect(screen.getByText('Everything has been read.')).toBeInTheDocument();
  });

  it('reads one that is pressed and follows where it leads', async () => {
    const { onRead, onFollow, user } = draw();

    await user.click(screen.getByText('Something new to watch'));

    expect(onRead).toHaveBeenCalledWith('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
    expect(onFollow).toHaveBeenCalledWith('/?show=s1');
  });

  it('reads one that leads nowhere without following it', async () => {
    const { onRead, onFollow, user } = draw();

    await user.click(screen.getByText('Scan finished'));

    expect(onRead).toHaveBeenCalledWith('3f2504e0-4f89-41d3-9a0c-0305e82c3302');
    expect(onFollow).not.toHaveBeenCalled();
  });

  it('marks everything read and clears everything', async () => {
    const { onReadAll, onClearAll, user } = draw();

    await user.click(screen.getByRole('button', { name: 'Mark all read' }));
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onReadAll).toHaveBeenCalledTimes(1);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('offers neither where there is nothing unread and nothing at all', () => {
    draw({ notifications: [], unread: 0 });

    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
  });

  it('offers to push them to this device where it can', async () => {
    const onToggle = vi.fn();
    const { user } = draw({ push: { isOn: false, onToggle } });

    expect(screen.getByText('Send push notifications to this device')).toBeInTheDocument();

    await user.click(screen.getByRole('switch'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NotificationList.displayName).toBe('NotificationList');
  });
});
