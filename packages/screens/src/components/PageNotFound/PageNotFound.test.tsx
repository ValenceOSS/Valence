import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageNotFound } from './PageNotFound';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PageNotFound', () => {
  it('says the page could not be found', () => {
    render(<PageNotFound />);

    expect(
      screen.getByRole('heading', { name: 'This page could not be found' }),
    ).toBeInTheDocument();
  });

  it('goes back to where somebody came from', async () => {
    const user = userEvent.setup();
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    render(<PageNotFound />);

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(back).toHaveBeenCalledTimes(1);
  });

  it('offers the way to the start as well', () => {
    render(<PageNotFound />);

    expect(screen.getByRole('button', { name: 'Go to the start' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PageNotFound.displayName).toBe('PageNotFound');
  });
});
