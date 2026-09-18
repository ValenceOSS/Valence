import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WelcomeToValence } from './WelcomeToValence';

afterEach(() => {
  vi.useRealTimers();
});

describe('WelcomeToValence', () => {
  it('welcomes somebody to this instance by its own name', () => {
    render(<WelcomeToValence name="The Cinema" household="The Morgans" onFinished={vi.fn()} />);

    expect(screen.getByText('Welcome to The Cinema')).toBeInTheDocument();
  });

  it('says the household is ready, by the name they just chose', () => {
    render(<WelcomeToValence name="Valence" household="The Morgans" onFinished={vi.fn()} />);

    expect(screen.getByText(/The Morgans is ready/)).toBeInTheDocument();
  });

  it('leaves on its own rather than asking for a fourth click', () => {
    vi.useFakeTimers();

    const onFinished = vi.fn();

    render(<WelcomeToValence name="Valence" household="The Morgans" onFinished={onFinished} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(onFinished).toHaveBeenCalled();
  });

  it('is announced, since it replaces the screen somebody was working on', () => {
    render(<WelcomeToValence name="Valence" household="The Morgans" onFinished={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
