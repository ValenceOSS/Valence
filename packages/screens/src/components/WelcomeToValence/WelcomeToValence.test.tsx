import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WelcomeToValence } from './WelcomeToValence';

describe('WelcomeToValence', () => {
  it('welcomes somebody to this instance by its own name', () => {
    render(<WelcomeToValence name="The Cinema" household="The Morgans" onFinished={vi.fn()} />);

    expect(screen.getByText('Welcome to The Cinema')).toBeInTheDocument();
  });

  it('says the household is ready, by the name they just chose', () => {
    render(<WelcomeToValence name="Valence" household="The Morgans" onFinished={vi.fn()} />);

    expect(screen.getByText(/The Morgans is ready/)).toBeInTheDocument();
  });

  it('waits to be dismissed rather than timing out on somebody still reading', () => {
    const onFinished = vi.fn();

    render(<WelcomeToValence name="Valence" household="The Morgans" onFinished={onFinished} />);

    expect(screen.getByRole('button', { name: /Start watching/ })).toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('hands over when they say they are ready', async () => {
    const onFinished = vi.fn();

    render(<WelcomeToValence name="Valence" household="The Morgans" onFinished={onFinished} />);

    await userEvent.click(screen.getByRole('button', { name: /Start watching/ }));

    expect(onFinished).toHaveBeenCalled();
  });

  it('is announced, since it replaces the screen somebody was working on', () => {
    render(<WelcomeToValence name="Valence" household="The Morgans" onFinished={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
