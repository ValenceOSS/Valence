import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LibraryPicker } from './LibraryPicker';
import type { Library } from '@ValenceContracts/schemas/Library';

const MOVIES: Library = {
  id: 'lib-movies',
  name: 'Movies',
  kind: 'movies',
  path: '/media/movies',
  itemCount: 1204,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
};

const SHOWS: Library = { ...MOVIES, id: 'lib-shows', name: 'Shows', kind: 'shows', itemCount: 1 };

describe('LibraryPicker', () => {
  it('says how many items each library holds', () => {
    render(<LibraryPicker libraries={[MOVIES, SHOWS]} chosen={new Set()} onChange={vi.fn()} />);

    expect(screen.getByText('1,204 items')).toBeInTheDocument();
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('ticks every library at once', async () => {
    const onChange = vi.fn();

    render(<LibraryPicker libraries={[MOVIES, SHOWS]} chosen={new Set()} onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Every library' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['lib-movies', 'lib-shows']));
  });

  it('clears every library at once', async () => {
    const onChange = vi.fn();

    render(
      <LibraryPicker
        libraries={[MOVIES, SHOWS]}
        chosen={new Set(['lib-movies', 'lib-shows'])}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Every library' })).toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Every library' }));

    expect(onChange).toHaveBeenCalledWith(new Set());
  });

  it('ticks and clears one library on its own', async () => {
    const onChange = vi.fn();

    render(
      <LibraryPicker
        libraries={[MOVIES, SHOWS]}
        chosen={new Set(['lib-movies'])}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Every library' })).not.toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: /Shows/ }));

    expect(onChange).toHaveBeenLastCalledWith(new Set(['lib-movies', 'lib-shows']));

    await userEvent.click(screen.getByRole('checkbox', { name: /Movies/ }));

    expect(onChange).toHaveBeenLastCalledWith(new Set());
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LibraryPicker.displayName).toBe('LibraryPicker');
  });
});
