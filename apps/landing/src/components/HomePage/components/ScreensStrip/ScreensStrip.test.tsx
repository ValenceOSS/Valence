import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScreensStrip } from './ScreensStrip';

describe('ScreensStrip', () => {
  it('names every screen Valence plays on, in one list', () => {
    render(<ScreensStrip />);

    const list = within(screen.getByRole('region', { name: 'Screens Valence plays on' })).getByRole(
      'list',
    );

    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Web', 'iPhone and iPad', 'Android', 'Apple TV', 'Android TV', 'Desktop']);
  });

  it('says what the row means beneath it', () => {
    render(<ScreensStrip />);

    expect(screen.getByText('Plays on every screen in the house')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScreensStrip.displayName).toBe('ScreensStrip');
  });
});
