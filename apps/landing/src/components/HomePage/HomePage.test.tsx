import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { HomePage } from './HomePage';

/**
 * Whether one element comes after another in the document.
 *
 * @returns True when `later` follows `earlier`.
 */
const follows = (earlier: Element, later: Element): boolean =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe('HomePage', () => {
  it('opens with the hero', async () => {
    await renderWithRoutes(HomePage);

    expect(
      screen.getByRole('heading', { level: 1, name: /Your films, shows, music and books/u }),
    ).toBeInTheDocument();
  });

  it('shows the app itself within the hero', async () => {
    await renderWithRoutes(HomePage);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app's home page, with a film in the featured row",
      }),
    ).toHaveAttribute('src', '/devices/web.jpg');
  });

  it('runs from the screens it plays on, to whose data it is, to its figures, to linked servers', async () => {
    await renderWithRoutes(HomePage);

    const order = [
      screen.getByRole('region', { name: 'Screens Valence plays on' }),
      screen.getByRole('region', { name: 'On your data' }),
      screen.getByRole('region', { name: 'What Valence is' }),
      screen.getByRole('region', { name: 'Linked servers' }),
    ];

    order.slice(1).forEach((section, at) => {
      const before = order[at];

      expect(before !== undefined && follows(before, section)).toBe(true);
    });
  });

  it('shows the newest releases, and ends asking whether you are ready', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.getByRole('region', { name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Get started' })).toBeInTheDocument();
  });

  it('leaves the feature groups and the phone showcases for their own chapters', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.queryByRole('region', { name: 'Viewing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Valence on a phone' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HomePage.displayName).toBe('HomePage');
  });
});
