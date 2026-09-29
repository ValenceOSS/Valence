import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmItIsYou } from './ConfirmItIsYou';

const confirmItIsYouMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/session/auth', () => ({ confirmItIsYou: confirmItIsYouMock }));

beforeEach(() => {
  confirmItIsYouMock.mockReset();
});

describe('ConfirmItIsYou', () => {
  it('confirms with the password typed, and says so', async () => {
    const onConfirmed = vi.fn();

    confirmItIsYouMock.mockResolvedValue({ kind: 'confirmed' });
    render(<ConfirmItIsYou onConfirmed={onConfirmed} />);

    await userEvent.type(screen.getByLabelText('Password'), 'a-long-enough-password');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(confirmItIsYouMock).toHaveBeenCalledWith('a-long-enough-password');
    expect(onConfirmed).toHaveBeenCalledOnce();
  });

  it('says why where it was not confirmed, and stays', async () => {
    const onConfirmed = vi.fn();

    confirmItIsYouMock.mockResolvedValue({ kind: 'failed', reason: 'That is not your password.' });
    render(<ConfirmItIsYou onConfirmed={onConfirmed} />);

    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('That is not your password.')).toBeInTheDocument();
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('asks for nothing until there is a password to send', () => {
    render(<ConfirmItIsYou onConfirmed={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });
});
