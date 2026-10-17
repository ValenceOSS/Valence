import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageProblem } from './PageProblem';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PageProblem', () => {
  it('says on the splash screen that the page stopped, rather than showing nothing at all', () => {
    render(<PageProblem />);

    expect(screen.getByRole('alert')).toHaveTextContent('This page stopped working');
  });

  it('says why, by what kind of failure it was', () => {
    render(<PageProblem error={new Error('TypeError: Failed to fetch')} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Can’t reach Valence');
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
