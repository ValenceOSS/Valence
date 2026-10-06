import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { LatestReleases } from './LatestReleases';

describe('LatestReleases', () => {
  it('lists the four newest releases, each leading to its own page', async () => {
    await renderWithRoutes(LatestReleases);

    const list = await screen.findByRole('list');
    const newest = CHANGELOG[0];

    expect(within(list).getAllByRole('listitem')).toHaveLength(Math.min(4, CHANGELOG.length));
    expect(
      within(list).getByRole('link', { name: new RegExp(newest?.title ?? '', 'u') }),
    ).toHaveAttribute('href', `/changelog/${newest?.slug ?? ''}`);
  });

  it('leads on to every release', async () => {
    await renderWithRoutes(LatestReleases);

    expect(await screen.findByRole('link', { name: 'Every release' })).toHaveAttribute(
      'href',
      '/changelog',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LatestReleases.displayName).toBe('LatestReleases');
  });
});
