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
  it('opens with the hero, its light written out in characters', async () => {
    const { container } = await renderWithRoutes(HomePage);

    expect(container.querySelector('.bg-aurora canvas')).toBeInTheDocument();

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
    ).toHaveAttribute('src', '/tour/home.jpg');
  });

  it('runs from the screens it plays on, to its figures, to every feature group, to the phone app', async () => {
    await renderWithRoutes(HomePage);

    const order = [
      screen.getByRole('region', { name: 'Screens Valence plays on' }),
      screen.getByRole('region', { name: 'What Valence is' }),
      screen.getByRole('region', { name: 'Viewing' }),
      screen.getByRole('region', { name: 'Valence on a phone' }),
    ];

    order.slice(1).forEach((section, at) => {
      const before = order[at];

      expect(before !== undefined && follows(before, section)).toBe(true);
    });
  });

  it('leaves linked servers to their own page', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.queryByRole('region', { name: 'Linked servers' })).not.toBeInTheDocument();
  });

  it('shows the newest releases, and ends asking whether you are ready', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.getByRole('region', { name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Get started' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HomePage.displayName).toBe('HomePage');
  });
});
