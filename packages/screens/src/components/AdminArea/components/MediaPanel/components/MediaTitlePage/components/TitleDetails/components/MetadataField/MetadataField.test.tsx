import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MetadataField } from './MetadataField';

/**
 * A change that always saves.
 *
 * @returns The spy.
 */
const saving = () => vi.fn(() => Promise.resolve({ isSaved: true, reason: '' }));

describe('MetadataField', () => {
  it('tells the form of each change rather than saving it', async () => {
    const user = userEvent.setup();
    const change = saving();
    const onValueChange = vi.fn();

    render(
      <MetadataField
        field="tagline"
        kind="film"
        state={{ value: null, source: 'catalogue', catalogue: null }}
        value={null}
        onValueChange={onValueChange}
        change={change}
      />,
    );

    await user.type(screen.getByLabelText('Tagline'), 'A');

    expect(onValueChange).toHaveBeenCalledWith('A');
    expect(change).not.toHaveBeenCalled();
  });

  it('puts an edited field back to what TMDB says', async () => {
    const user = userEvent.setup();
    const change = saving();

    render(
      <MetadataField
        field="title"
        kind="film"
        state={{ value: 'Mine', source: 'edited', catalogue: 'A film' }}
        value="Mine"
        onValueChange={vi.fn()}
        change={change}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(change).toHaveBeenCalledWith({ reset: ['title'] });
  });

  it('links an IMDb id to its page there', () => {
    render(
      <MetadataField
        field="imdbId"
        kind="film"
        state={{ value: 'tt0133093', source: 'catalogue', catalogue: 'tt0133093' }}
        value="tt0133093"
        onValueChange={vi.fn()}
        change={saving()}
      />,
    );

    expect(screen.getByRole('link', { name: 'Open on IMDb' })).toHaveAttribute(
      'href',
      'https://www.imdb.com/title/tt0133093/',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MetadataField.displayName).toBe('MetadataField');
  });
});
