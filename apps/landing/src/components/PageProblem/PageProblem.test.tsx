import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PageProblem } from './PageProblem';

describe('PageProblem', () => {
  it('says the page went wrong', () => {
    render(<PageProblem />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('This page stopped working')).toBeInTheDocument();
  });

  it('reloads the page when asked to try again', async () => {
    const reload = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });

    const user = userEvent.setup();

    render(<PageProblem />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reload).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PageProblem.displayName).toBe('PageProblem');
  });
});
