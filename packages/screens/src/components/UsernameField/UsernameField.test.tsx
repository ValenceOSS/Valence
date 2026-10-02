import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isUsernameAvailable } from '@ValenceClient/admin/isUsernameAvailable';
import { UsernameField } from './UsernameField';

vi.mock('@ValenceClient/admin/isUsernameAvailable', () => ({ isUsernameAvailable: vi.fn() }));

const checks = vi.mocked(isUsernameAvailable);

beforeEach(() => {
  vi.useFakeTimers();
  checks.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Lets the pause before a check pass, and the check answer.
 */
const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
};

describe('UsernameField', () => {
  it('says a free username is free', async () => {
    checks.mockResolvedValue(true);

    render(<UsernameField value="ada" onValueChange={vi.fn()} userId="usr-1" />);
    await settle();

    expect(checks).toHaveBeenCalledWith('ada', 'usr-1');
    expect(screen.getByText('That username is free.')).toBeInTheDocument();
  });

  it('says a username somebody holds is taken', async () => {
    checks.mockResolvedValue(false);

    render(<UsernameField value="sam" onValueChange={vi.fn()} />);
    await settle();

    expect(screen.getByText('That username is already in use.')).toBeInTheDocument();
  });

  it('says what a username may hold rather than asking about one it cannot be', async () => {
    render(<UsernameField value="a b" onValueChange={vi.fn()} />);
    await settle();

    expect(checks).not.toHaveBeenCalled();
    expect(screen.getByText(/letters, digits, dots and underscores/)).toBeInTheDocument();
  });

  it('does not ask about the username the account already holds', async () => {
    render(<UsernameField value="Ada" current="ada" onValueChange={vi.fn()} />);
    await settle();

    expect(checks).not.toHaveBeenCalled();
  });

  it('says when it may be left empty', () => {
    render(<UsernameField value="" onValueChange={vi.fn()} isOptional />);

    expect(screen.getByLabelText('Username (optional)')).toBeInTheDocument();
  });
});
