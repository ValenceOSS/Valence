import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WelcomeToValence } from './WelcomeToValence';

describe('WelcomeToValence', () => {
  it('welcomes somebody to this instance by its own name', () => {
    render(<WelcomeToValence name="The Cinema" onFinished={vi.fn()} />);

    expect(screen.getByText('Welcome to The Cinema')).toBeInTheDocument();
  });

  it('says they are all set, without naming anybody', () => {
    render(<WelcomeToValence name="Valence" onFinished={vi.fn()} />);

    expect(screen.getByText(/You’re all set/)).toBeInTheDocument();
  });

  it('waits to be dismissed rather than timing out on somebody still reading', () => {
    const onFinished = vi.fn();

    render(<WelcomeToValence name="Valence" onFinished={onFinished} />);

    expect(screen.getByRole('button', { name: /Start watching/ })).toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('hands over when they say they are ready', async () => {
    const onFinished = vi.fn();

    render(<WelcomeToValence name="Valence" onFinished={onFinished} />);

    await userEvent.click(screen.getByRole('button', { name: /Start watching/ }));

    await waitFor(() => {
      expect(onFinished).toHaveBeenCalled();
    });
  });

  it('clears the words before handing over, rather than cutting on the press', async () => {
    const onFinished = vi.fn();

    render(<WelcomeToValence name="Valence" onFinished={onFinished} />);

    await userEvent.click(screen.getByRole('button', { name: /Start watching/ }));

    expect(onFinished).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onFinished).toHaveBeenCalled();
    });
  });

  it('is announced, since it replaces the screen somebody was working on', () => {
    render(<WelcomeToValence name="Valence" onFinished={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
