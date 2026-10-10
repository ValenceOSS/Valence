import userEvent from '@testing-library/user-event';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
  clientKind: 'browser' as const,
  connectedAt: 0,
  playback: null,
  listening: null,
  bookListening: null,
  reading: null,
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

describe('ActivityPanel', () => {
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

    expect(screen.getAllByRole('heading', { name: 'Dan' })).toHaveLength(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ActivityPanel.displayName).toBe('ActivityPanel');
  });
});
