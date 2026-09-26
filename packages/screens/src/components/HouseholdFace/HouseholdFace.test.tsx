import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HouseholdFace } from './HouseholdFace';
import type { Household } from '@ValenceContracts/schemas/Household';

const HOUSEHOLD: Household = {
  name: 'The Morgans',
  colour: '#3ac47d',
  avatar: { kind: 'photo', isVideo: false, frame: null },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

describe('HouseholdFace', () => {
  it('draws your own household from your own address', () => {
    const { container } = render(<HouseholdFace household={HOUSEHOLD} />);

    expect(container.querySelector('img')?.getAttribute('src')).toContain('/api/account/avatar');
  });

  it('draws somebody else’s through the route an administrator has', () => {
    const { container } = render(<HouseholdFace household={HOUSEHOLD} accountId="abc" />);

    expect(container.querySelector('img')?.getAttribute('src')).toContain(
      '/api/admin/accounts/abc/avatar',
    );
  });

  it('carries the time it changed, so a new picture is not the old one cached', () => {
    const { container } = render(<HouseholdFace household={HOUSEHOLD} />);

    expect(container.querySelector('img')?.getAttribute('src')).toContain('2026-09-18');
  });

  it('falls back to the letter of the household name', () => {
    render(
      <HouseholdFace household={{ ...HOUSEHOLD, avatar: { kind: 'initial', font: 'gilroy' } }} />,
    );

    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
