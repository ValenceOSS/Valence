import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterSplit } from './FilterSplit';

const GROUPS = [
  {
    name: 'Genre',
    options: [
      { id: 'genre:Drama', label: 'Drama' },
      { id: 'genre:Comedy', label: 'Comedy' },
    ],
  },
  {
    name: 'Rating',
    isSingle: true,
    options: [
      { id: 'rating:7', label: '7+' },
      { id: 'rating:8', label: '8+' },
    ],
  },
];

describe('FilterSplit', () => {
  it('draws a choice for each kind of filter, saying how many of its own are on', () => {
    render(
      <FilterSplit
        label="Filter the library"
        groups={GROUPS}
        selected={new Set(['genre:Drama', 'genre:Comedy'])}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('group', { name: 'Filter the library' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Genre' })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Rating' })).not.toHaveTextContent(/\d/);
  });

  it('ticks several of a kind that allows several, keeping every other filter', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterSplit
        label="Filter the library"
        groups={GROUPS}
        selected={new Set(['genre:Drama', 'rating:7'])}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Genre' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Comedy' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['genre:Drama', 'rating:7', 'genre:Comedy']));
  });

  it('takes one answer of a kind that allows one, and any to clear it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterSplit
        label="Filter the library"
        groups={GROUPS}
        selected={new Set(['genre:Drama', 'rating:7'])}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Rating' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '8+' }));

    expect(onChange).toHaveBeenLastCalledWith(new Set(['genre:Drama', 'rating:8']));

    await user.click(screen.getByRole('button', { name: 'Rating' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Any' }));

    expect(onChange).toHaveBeenLastCalledWith(new Set(['genre:Drama']));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FilterSplit.displayName).toBe('FilterSplit');
  });
});
