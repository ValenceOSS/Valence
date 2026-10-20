import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountAvatarPicker } from './AccountAvatarPicker';
import type { Household } from '@ValenceContracts/schemas/Household';

const FACE: Household = {
  name: 'The Morgans',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  updatedAt: '2026-10-20T00:00:00.000Z',
};

const DRAFT = { avatar: FACE.avatar, colour: FACE.colour, photo: null };

describe('AccountAvatarPicker', () => {
  it('offers an administrator the account’s initial instead of a picture', async () => {
    const onDraft = vi.fn();

    render(<AccountAvatarPicker accountId="usr_1" face={FACE} draft={DRAFT} onDraft={onDraft} />);
    await userEvent.click(screen.getByRole('button', { name: 'Use their initial instead' }));

    expect(onDraft).toHaveBeenCalledWith({
      avatar: { kind: 'initial', font: 'gilroy' },
      photo: null,
    });
  });

  it('offers no initial on somebody’s own account, which wears its owner’s face instead', () => {
    render(
      <AccountAvatarPicker
        accountId="p-dan"
        face={FACE}
        draft={DRAFT}
        onDraft={vi.fn()}
        isOwnAccount
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Use their initial instead' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('A photo or an illustrated avatar.')).toBeInTheDocument();
    expect(screen.getByText('The tint on the illustrated avatar.')).toBeInTheDocument();
  });

  it('draws a face seeded by whoever it is for', async () => {
    const onDraft = vi.fn();

    render(<AccountAvatarPicker accountId="usr_1" face={FACE} draft={DRAFT} onDraft={onDraft} />);
    await userEvent.click(screen.getByRole('button', { name: 'Use the bottts avatar' }));

    expect(onDraft).toHaveBeenCalledWith({
      avatar: { kind: 'drawn', style: 'bottts', seed: 'usr_1' },
      photo: null,
    });
  });

  it('takes a colour', async () => {
    const onDraft = vi.fn();

    render(<AccountAvatarPicker accountId="usr_1" face={FACE} draft={DRAFT} onDraft={onDraft} />);
    await userEvent.click(screen.getByRole('button', { name: 'Use #e8503a' }));

    expect(onDraft).toHaveBeenCalledWith({ colour: '#e8503a' });
  });
});
