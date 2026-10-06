import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { ChangelogPage } from './ChangelogPage';

describe('ChangelogPage', () => {
  it('lists every release, each leading to its own page', async () => {
    await renderWithRoutes(ChangelogPage, '/changelog');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'What is new in Valence' }),
    ).toBeInTheDocument();

    for (const entry of CHANGELOG) {
      expect(screen.getByRole('link', { name: entry.title })).toHaveAttribute(
        'href',
        `/changelog/${entry.slug}`,
      );
    }
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChangelogPage.displayName).toBe('ChangelogPage');
  });
});
