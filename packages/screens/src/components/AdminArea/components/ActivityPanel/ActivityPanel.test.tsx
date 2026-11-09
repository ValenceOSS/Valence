import userEvent from '@testing-library/user-event';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActivityPanel } from './ActivityPanel';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

const session = (overrides: Partial<ActiveSession> = {}): ActiveSession => ({
  clientId: 'cli_1',
  accountId: 'acc_1',
  profileId: 'prf_1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: 'Chrome on macOS',
  device: null,
  client: null,
  identity: null,
  userAgent: null,
  clientKind: 'browser' as const,
  connectedAt: 0,
  streams: null,
  playback: null,
  listening: null,
  bookListening: null,
  reading: null,
  controlledFrom: null,
  remoteFor: null,
  ...overrides,
});

const props = {
  sessions: [],
  busyClientId: null,
  onStop: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onMessage: () => Promise.resolve(),
};

afterEach(() => {
  window.localStorage.removeItem('valence.sessionCardSize');
  window.localStorage.removeItem('valence.gridSize');
});

describe('ActivityPanel', () => {
  it('says nothing about who has the app open until the sessions arrive', () => {
    render(<ActivityPanel {...props} isReading />, { wrapper: CacheScope });

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('No one is using the app right now.')).not.toBeInTheDocument();
  });

  it('says when nobody has the app open', () => {
    render(<ActivityPanel {...props} />, { wrapper: CacheScope });

    expect(screen.getByText('No one is using the app right now.')).toBeInTheDocument();
  });

  it('lists sessions as a table to begin with', () => {
    render(<ActivityPanel {...props} sessions={[session()]} />, { wrapper: CacheScope });

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('groups sessions under the viewer holding them, as cards', async () => {
    render(<ActivityPanel {...props} sessions={[session(), session({ clientId: 'cli_2' })]} />, {
      wrapper: CacheScope,
    });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Show as cards' }));

    expect(screen.getAllByRole('region', { name: 'Dan' })).toHaveLength(1);
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('offers to size the cards only while they are showing', async () => {
    const user = userEvent.setup();

    render(<ActivityPanel {...props} sessions={[session()]} />, { wrapper: CacheScope });

    await user.click(screen.getByRole('button', { name: 'Show as a table' }));

    expect(screen.queryByRole('group', { name: 'Card size' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Show as cards' }));

    expect(screen.getByRole('group', { name: 'Card size' })).toBeInTheDocument();
  });

  it('remembers the size chosen for the session cards apart from the library’s', async () => {
    const user = userEvent.setup();

    render(<ActivityPanel {...props} sessions={[session()]} />, { wrapper: CacheScope });

    await user.click(screen.getByRole('button', { name: 'Show as cards' }));
    await user.click(screen.getByRole('button', { name: 'Large cards, fewer per row' }));

    expect(window.localStorage.getItem('valence.sessionCardSize')).toBe('large');
    expect(window.localStorage.getItem('valence.gridSize')).toBeNull();
    expect(screen.getByRole('article').parentElement).toHaveStyle({
      width: 'min(29.375rem, 100%)',
    });
  });

  it('draws the session cards at the size last chosen', async () => {
    window.localStorage.setItem('valence.sessionCardSize', 'small');

    render(<ActivityPanel {...props} sessions={[session()]} />, { wrapper: CacheScope });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Show as cards' }));

    expect(screen.getByRole('article').parentElement).toHaveStyle({ width: 'min(15rem, 100%)' });
  });

  it('signs a device out from the table once that is confirmed', async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();

    render(<ActivityPanel {...props} sessions={[session()]} onSignOut={onSignOut} />, {
      wrapper: CacheScope,
    });

    await user.click(screen.getByRole('button', { name: 'Show as a table' }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out this device' }));

    expect(onSignOut).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Sign out device' }));

    expect(onSignOut).toHaveBeenCalledWith('cli_1');
  });

  it('signs a device out from its card once that is confirmed', async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();

    render(<ActivityPanel {...props} sessions={[session()]} onSignOut={onSignOut} />, {
      wrapper: CacheScope,
    });

    await user.click(screen.getByRole('button', { name: 'Show as cards' }));
    await user.click(screen.getByRole('button', { name: 'Sign out this device' }));
    await user.click(await screen.findByRole('button', { name: 'Sign out device' }));

    expect(onSignOut).toHaveBeenCalledWith('cli_1');
  });

  it('leaves a device signed in when the question is turned down', async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();

    render(<ActivityPanel {...props} sessions={[session()]} onSignOut={onSignOut} />, {
      wrapper: CacheScope,
    });

    await user.click(screen.getByRole('button', { name: 'Show as cards' }));
    await user.click(screen.getByRole('button', { name: 'Sign out this device' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(onSignOut).not.toHaveBeenCalled();
  });

  it('offers no sign-out to somebody who may not, for a guest, who holds no sign-in, or for this tab', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ActivityPanel {...props} sessions={[session()]} />, {
      wrapper: CacheScope,
    });

    await user.click(screen.getByRole('button', { name: 'Show as cards' }));

    expect(screen.queryByRole('button', { name: 'Sign out this device' })).not.toBeInTheDocument();

    rerender(
      <ActivityPanel {...props} sessions={[session({ accountId: null })]} onSignOut={vi.fn()} />,
    );

    expect(screen.queryByRole('button', { name: 'Sign out this device' })).not.toBeInTheDocument();

    rerender(
      <ActivityPanel
        {...props}
        sessions={[session({ clientId: 'client-1' })]}
        onSignOut={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Sign out this device' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ActivityPanel.displayName).toBe('ActivityPanel');
  });
});
