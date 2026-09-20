import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageProblem } from './PageProblem';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PageProblem', () => {
  it('says which part stopped, rather than showing nothing at all', () => {
    render(<PageProblem />);

    expect(screen.getByRole('heading', { name: 'This page stopped working' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('says the rest of Valence is still running, since it is', () => {
    render(<PageProblem />);

    expect(screen.getByText(/rest of Valence is still running/)).toBeInTheDocument();
  });

  it('says why, by what kind of failure it was, and shows what the failure said', () => {
    render(<PageProblem error={new Error('TypeError: Failed to fetch')} />);

    expect(
      screen.getByRole('heading', { name: 'Valence could not be reached' }),
    ).toBeInTheDocument();
    expect(screen.getByText('TypeError: Failed to fetch')).toBeInTheDocument();
  });

  it('offers a way out to the start', async () => {
    const assign = vi.fn();
    const actor = userEvent.setup();

    vi.stubGlobal('location', { ...window.location, assign });

    render(<PageProblem />);

    await actor.click(screen.getByRole('button', { name: 'Go to the start' }));

    expect(assign).toHaveBeenCalledWith('/');
  });

  it('offers a way to try again', async () => {
    const reload = vi.fn();
    const actor = userEvent.setup();

    vi.stubGlobal('location', { ...window.location, reload });

    render(<PageProblem />);

    await actor.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reload).toHaveBeenCalled();
  });
});
