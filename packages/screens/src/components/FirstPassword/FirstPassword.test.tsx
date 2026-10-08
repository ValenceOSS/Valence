import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { FirstPassword } from './FirstPassword';

const hasAPassword = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
const giveFirstPassword = vi.hoisted(() =>
  vi.fn<(password: string) => Promise<{ message: string } | null>>(),
);

vi.mock('@ValenceClient/session/auth', () => ({ hasAPassword, fetchSession: vi.fn() }));
vi.mock('@ValenceClient/setup/giveFirstPassword', () => ({ giveFirstPassword }));

const PASSWORD = 'a-long-enough-password';

/**
 * Draws the row in a cache of its own.
 *
 * @param onChanged - Told once the password is set.
 */
const drawIt = (onChanged = vi.fn()) => {
  render(
    <CacheScope>
      <FirstPassword onChanged={onChanged} />
    </CacheScope>,
  );
};

/**
 * Lets everything already due on the page happen.
 */
const settle = async (): Promise<void> => {
  await new Promise((done) => {
    setTimeout(done, 0);
  });
};

beforeEach(() => {
  hasAPassword.mockReset().mockResolvedValue(false);
  giveFirstPassword.mockReset().mockResolvedValue(null);
});

describe('FirstPassword', () => {
  it('lets an account with only a passkey choose its first password', async () => {
    const onChanged = vi.fn();

    drawIt(onChanged);

    await userEvent.click(await screen.findByRole('button', { name: 'Set up' }));
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(giveFirstPassword).toHaveBeenCalledWith(PASSWORD);
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it('will not save a password too short', async () => {
    drawIt();

    await userEvent.click(await screen.findByRole('button', { name: 'Set up' }));
    await userEvent.type(screen.getByLabelText('Password'), 'short');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('says why the server refused it', async () => {
    giveFirstPassword.mockResolvedValue({ message: 'That account already has a password.' });

    drawIt();

    await userEvent.click(await screen.findByRole('button', { name: 'Set up' }));
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('That account already has a password.')).toBeInTheDocument();
  });

  it('shows nothing for an account that already has a password', async () => {
    hasAPassword.mockResolvedValue(true);

    drawIt();
    await settle();

    expect(screen.queryByRole('button', { name: 'Set up' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FirstPassword.displayName).toBe('FirstPassword');
  });
});
