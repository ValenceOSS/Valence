import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileAskCard } from './ProfileAskCard';

const ASK = {
  asker: { id: 'p', name: 'Priya' },
  profileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  profileName: 'UHD 4K',
};

describe('ProfileAskCard', () => {
  it('says who asked for what, and switches or keeps', async () => {
    const onDecide = vi.fn();

    render(<ProfileAskCard ask={ASK} currentName="HD 1080p" isBusy={false} onDecide={onDecide} />);

    expect(
      screen.getByText('Priya asked for the UHD 4K profile. It’s being fetched with HD 1080p.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Switch to UHD 4K' }));
    await userEvent.click(screen.getByRole('button', { name: 'Keep HD 1080p' }));

    expect(onDecide.mock.calls).toEqual([['switch'], ['keep']]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfileAskCard.displayName).toBe('ProfileAskCard');
  });
});
