import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchButtons } from './SearchButtons';

describe('SearchButtons', () => {
  it('searches for a season automatically or by hand', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onInteractiveSearch = vi.fn();

    render(
      <SearchButtons
        scope={{ season: 1, episode: null }}
        onSearch={onSearch}
        onInteractiveSearch={onInteractiveSearch}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Search for Season 1' }));
    await user.click(screen.getByRole('button', { name: 'Interactive search for Season 1' }));

    expect(onSearch).toHaveBeenCalledWith({ season: 1, episode: null });
    expect(onInteractiveSearch).toHaveBeenCalledWith({ season: 1, episode: null });
  });

  it('leaves out a search that cannot be done', () => {
    render(<SearchButtons scope={{ season: 2, episode: 5 }} onSearch={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Search for S02E05' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Interactive/ })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SearchButtons.displayName).toBe('SearchButtons');
  });
});
