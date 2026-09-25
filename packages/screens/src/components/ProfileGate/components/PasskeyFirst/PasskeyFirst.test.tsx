import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasskeyFirst } from './PasskeyFirst';

const drawIt = (overrides: Partial<Parameters<typeof PasskeyFirst>[0]> = {}) => {
  const onPasskey = vi.fn();
  const onOtherWays = vi.fn();

  render(
    <PasskeyFirst
      name="Valence"
      isUsingPasskey={false}
      problem={null}
      onPasskey={onPasskey}
      onOtherWays={onOtherWays}
      {...overrides}
    />,
  );

  return { onPasskey, onOtherWays };
};

describe('PasskeyFirst', () => {
  it('asks for a passkey quietly the once as it opens', () => {
    const { onPasskey } = drawIt();

    expect(onPasskey).toHaveBeenCalledTimes(1);
    expect(onPasskey).toHaveBeenCalledWith(true);
  });

  it('asks out loud when somebody presses for one, and offers the other ways in', async () => {
    const { onPasskey, onOtherWays } = drawIt();

    await userEvent.click(screen.getByRole('button', { name: /Use a passkey/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Other ways to sign in' }));

    expect(onPasskey).toHaveBeenLastCalledWith(false);
    expect(onOtherWays).toHaveBeenCalled();
  });

  it('says what went wrong, and what this server is called', () => {
    drawIt({ problem: 'That key is not for this account.', name: 'Flux' });

    expect(screen.getByText('That key is not for this account.')).toBeInTheDocument();
    expect(screen.getByText(/the passkey you sign in to Flux with/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PasskeyFirst.displayName).toBe('PasskeyFirst');
  });
});
