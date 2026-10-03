import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { AccountStep } from './AccountStep';
import type { AccountDraft } from '@ValenceScreens/components/SetupWizard/SetupWizard.types';

const EMPTY: AccountDraft = { name: '', username: '', email: '', password: '', again: '' };

const Held = ({
  start = EMPTY,
  onBack = vi.fn(),
  onContinue = vi.fn(),
}: {
  start?: AccountDraft;
  onBack?: () => void;
  onContinue?: () => void;
}) => {
  const [draft, setDraft] = useState(start);

  return <AccountStep draft={draft} onChange={setDraft} onBack={onBack} onContinue={onContinue} />;
};

const renderStep = (props: Parameters<typeof Held>[0] = {}) =>
  render(<Held {...props} />, { wrapper: CacheScope });

const fill = async () => {
  await userEvent.type(screen.getByLabelText('Name'), 'Operator');
  await userEvent.type(screen.getByLabelText('Username'), 'operator');
  await userEvent.type(screen.getByLabelText('Password'), 'a-long-enough-password');
  await userEvent.type(screen.getByLabelText('Confirm password'), 'a-long-enough-password');
};

describe('AccountStep', () => {
  it('says the address is only for a password reset', () => {
    renderStep();

    expect(screen.getByLabelText('Email (optional)')).toHaveAccessibleDescription(
      'Only used to send you a link if you forget your password.',
    );
  });

  it('says nothing is wrong before anybody has tried to go on', () => {
    renderStep();

    expect(screen.queryByText('Enter a name for the administrator account.')).toBeNull();
  });

  it('will not go on with an incomplete account, and says what is missing', async () => {
    const onContinue = vi.fn();

    renderStep({ onContinue });

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a name for the administrator account.')).toBeInTheDocument();
    expect(screen.getByText('Choose a username to sign in with.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 10 characters.')).toBeInTheDocument();
  });

  it('goes on with a good account and no address', async () => {
    const onContinue = vi.fn();

    renderStep({ onContinue });

    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('refuses an address that is not one', async () => {
    const onContinue = vi.fn();

    renderStep({ onContinue });

    await fill();
    await userEvent.type(screen.getByLabelText('Email (optional)'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('says the second password differs once it is as long as the first', async () => {
    renderStep({
      start: { ...EMPTY, password: 'a-long-enough-password' },
    });

    const again = screen.getByLabelText('Confirm password');

    await userEvent.type(again, 'a-long');

    expect(screen.queryByText('The passwords don’t match.')).toBeNull();

    await userEvent.type(again, '-enough-passwore');

    expect(screen.getByText('The passwords don’t match.')).toBeInTheDocument();
  });

  it('goes back to the welcome', async () => {
    const onBack = vi.fn();

    renderStep({ onBack });

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
