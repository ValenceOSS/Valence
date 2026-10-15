import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { aViewerProfile } from '@ValenceClient/testing/aViewerProfile';
import { ProfileRoster } from './ProfileRoster';

const OWNER = aViewerProfile({ id: 'dan', name: 'Dan', hasPin: true });
const KID = aViewerProfile({ id: 'kid', name: 'Kid', isOwner: false, mayRequest: false });

describe('ProfileRoster', () => {
  it('marks the owner, a PIN and a profile that may not ask', () => {
    render(<ProfileRoster profiles={[OWNER, KID]} onAdd={vi.fn()} />);

    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('PIN')).toBeInTheDocument();
    expect(screen.getByText('No requests')).toBeInTheDocument();
  });

  it('draws what may be done to each profile at the end of its row', () => {
    render(
      <ProfileRoster
        profiles={[OWNER, KID]}
        menuFor={(profile) => <span>{`menu for ${profile.name}`}</span>}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByText('menu for Kid')).toBeInTheDocument();
  });

  it('adds somebody in the next colour along, and clears the name once added', async () => {
    const onAdd = vi.fn(() => Promise.resolve(true));

    render(<ProfileRoster profiles={[OWNER]} onAdd={onAdd} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Add a profile' }), '  Sam  ');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith('Sam', PROFILE_COLOURS[1]);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Add a profile' })).toHaveValue('');
    });
  });

  it('keeps the name where it could not be added', async () => {
    render(<ProfileRoster profiles={[OWNER]} onAdd={() => Promise.resolve(false)} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Add a profile' }), 'Sam');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
    });
    expect(screen.getByRole('textbox', { name: 'Add a profile' })).toHaveValue('Sam');
  });

  it('says the account is full rather than offering to add a seventh', () => {
    const six = Array.from({ length: 6 }, (_, at) =>
      aViewerProfile({ id: `p${at.toString()}`, name: `P${at.toString()}`, isOwner: at === 0 }),
    );

    render(<ProfileRoster profiles={six} onAdd={vi.fn()} />);

    expect(screen.getByText('An account can hold 6 profiles.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });
});
