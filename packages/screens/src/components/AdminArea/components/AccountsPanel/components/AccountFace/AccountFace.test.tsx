import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountFace } from './AccountFace';
import type { Account } from '@ValenceContracts/schemas/Account';

const PROFILE = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'photo', isVideo: false, frame: null },
  askStillWatchingAfter: 0,
  showsWhatIamWatching: false,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
} as const;

const HOUSEHOLD = {
  name: 'Marques',
  colour: '#e8503a',
  avatar: { kind: 'initial', font: 'gilroy' },
  updatedAt: '2026-08-01T00:00:00.000Z',
} as const;

const account = (over: Partial<Account> = {}): Account => ({
  id: 'account-1',
  name: 'Marques',
  email: 'm@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
  isBanned: false,
  banReason: null,
  position: null,
  isAdministrator: false,
  face: HOUSEHOLD,
  profile: PROFILE,
  roles: [],
  ...over,
});

describe('AccountFace', () => {
  it('draws the photo of the account’s own profile where the household is only an initial', () => {
    const { container } = render(<AccountFace account={account()} />);

    expect(container.querySelector('img')?.getAttribute('src')).toContain(
      `/api/profiles/${PROFILE.id}/avatar`,
    );
  });

  it('draws the household’s own picture where it was given one', () => {
    const { container } = render(
      <AccountFace
        account={account({
          face: { ...HOUSEHOLD, avatar: { kind: 'photo', isVideo: false, frame: null } },
        })}
      />,
    );

    expect(container.querySelector('img')?.getAttribute('src')).toContain(
      '/api/admin/accounts/account-1/avatar',
    );
  });

  it('draws the initial where there is neither a household face nor a profile', () => {
    render(<AccountFace account={account({ face: null, profile: null })} />);

    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AccountFace.displayName).toBe('AccountFace');
  });
});
