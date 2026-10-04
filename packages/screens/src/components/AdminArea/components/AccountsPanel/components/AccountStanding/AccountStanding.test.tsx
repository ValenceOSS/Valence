import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
import { AccountStanding } from './AccountStanding';

const NOW = Date.UTC(2026, 9, 2);

const account = (changes: object) =>
  AccountSchema.parse({
    id: 'usr-1',
    name: 'Ada',
    email: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isBanned: false,
    banReason: null,
    position: null,
    isAdministrator: false,
    face: null,
    roles: [],
    ...changes,
  });

describe('AccountStanding', () => {
  it('says an account in use is active, with nothing beneath', () => {
    const { container } = render(<AccountStanding account={account({})} now={NOW} />);

    expect(screen.getByText('Active')).toBeVisible();
    expect(container.textContent).toBe('Active');
  });

  it('says a banned account is banned, and why', () => {
    render(
      <AccountStanding
        account={account({ isBanned: true, banReason: 'Shared their password.' })}
        now={NOW}
      />,
    );

    expect(screen.getByText('banned')).toBeVisible();
    expect(screen.getByText('Shared their password.')).toBeVisible();
  });

  it('says how long a waiting setup link has left', () => {
    render(
      <AccountStanding
        account={account({
          canSignIn: false,
          setup: { state: 'waiting', expiresAt: '2026-10-08T12:00:00.000Z' },
        })}
        now={NOW}
      />,
    );

    expect(screen.getByText('Waiting for setup')).toBeVisible();
    expect(screen.getByText('Link expires in 6 days')).toBeVisible();
  });

  it('leaves the detail out when asked to', () => {
    render(
      <AccountStanding
        account={account({
          canSignIn: false,
          setup: { state: 'waiting', expiresAt: '2026-10-08T12:00:00.000Z' },
        })}
        now={NOW}
        hasDetail={false}
      />,
    );

    expect(screen.getByText('Waiting for setup')).toBeVisible();
    expect(screen.queryByText(/Link expires after/)).not.toBeInTheDocument();
  });

  it('says a setup link has run out', () => {
    render(
      <AccountStanding
        account={account({
          canSignIn: false,
          setup: { state: 'expired', expiresAt: '2026-10-01T00:00:00.000Z' },
        })}
        now={NOW}
      />,
    );

    expect(screen.getByText('Link expired')).toBeVisible();
  });

  it('says an account with no way in cannot be signed in to yet', () => {
    render(<AccountStanding account={account({ canSignIn: false })} now={NOW} />);

    expect(screen.getByText('Can’t sign in yet')).toBeVisible();
  });
});
