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
    ).toEqual([
      'WebAny modern browser',
      'iPhone and iPadThe App Store',
      'AndroidGoogle Play',
      'Apple TVtvOS',
      'Android TVGoogle TV and more',
      'DesktopWindows, Mac and Linux',
    ]);
  });

  it('gives each screen its mark, in a cell of its own', () => {
    render(<ScreensStrip />);

    const cells = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(cells).toHaveLength(6);
    expect(screen.queryByText('Plays on every screen in the house')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScreensStrip.displayName).toBe('ScreensStrip');
  });
});
