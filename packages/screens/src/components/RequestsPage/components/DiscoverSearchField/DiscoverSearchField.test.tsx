import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DiscoverSearchField } from './DiscoverSearchField';

describe('DiscoverSearchField', () => {
  it('searches for the words entered, and for nothing while there are none', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();

    render(<DiscoverSearchField query="" onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Search Discover' }), '   {Enter}');

    expect(onSearch).not.toHaveBeenCalled();

    await user.type(screen.getByRole('searchbox', { name: 'Search Discover' }), ' dune {Enter}');

    expect(onSearch).toHaveBeenCalledWith('dune');
  });

  it('opens on the words already searched for', () => {
    render(<DiscoverSearchField query="dune" onSearch={vi.fn()} />);

    expect(screen.getByRole('searchbox', { name: 'Search Discover' })).toHaveValue('dune');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscoverSearchField.displayName).toBe('DiscoverSearchField');
  });
});
