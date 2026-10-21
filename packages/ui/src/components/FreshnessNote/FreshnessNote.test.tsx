import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FreshnessNote } from './FreshnessNote';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('FreshnessNote', () => {
  it('says nothing while nothing is being checked', () => {
    render(<FreshnessNote isChecking={false} couldNotCheck={false} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('says what is shown is being checked, with a spinner beside it', () => {
    render(<FreshnessNote isChecking couldNotCheck={false} />);

    expect(screen.getByText('Checking for changes')).toBeInTheDocument();
    expect(screen.getByLabelText('Checking for changes')).toBeInTheDocument();
  });

  it('says it is up to date once the check is done, then goes quiet', async () => {
    const { rerender } = render(<FreshnessNote isChecking couldNotCheck={false} />);

    rerender(<FreshnessNote isChecking={false} couldNotCheck={false} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByText('Up to date')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.queryByText('Up to date')).not.toBeInTheDocument();
  });

  it('says it could not check where the server did not answer, and keeps saying so', async () => {
    const { rerender } = render(<FreshnessNote isChecking couldNotCheck={false} />);

    rerender(<FreshnessNote isChecking={false} couldNotCheck />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.getByText('Couldn’t check for changes')).toBeInTheDocument();
    expect(screen.queryByText('Up to date')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FreshnessNote.displayName).toBe('FreshnessNote');
  });
});
