import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { ChangelogEntryPage } from './ChangelogEntryPage';

describe('ChangelogEntryPage', () => {
  it('draws the release the address names, section by section', async () => {
    await renderWithRoutes(ChangelogEntryPage, '/changelog/music-requests-and-households');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Music, requests, and a household that is safe for everyone in it',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ask for what is missing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fixes' })).toBeInTheDocument();
    expect(screen.getByText('Trailers on a title’s page.')).toBeInTheDocument();
  });

  it('leads to the releases either side of it, and back to the changelog', async () => {
    await renderWithRoutes(ChangelogEntryPage, '/changelog/music-requests-and-households');

    const around = await screen.findByRole('navigation', { name: 'Other releases' });

    expect(around).toHaveTextContent('Newer · v1.1.0');
    expect(around).toHaveTextContent('Older · v0.3.0');
    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/changelog');
  });

  it('has nothing newer to lead to from the newest release', async () => {
    await renderWithRoutes(ChangelogEntryPage, '/changelog/steadier-tests');

    const around = await screen.findByRole('navigation', { name: 'Other releases' });

    expect(around).not.toHaveTextContent('Newer');
    expect(around).toHaveTextContent('Older · v1.1.1');
  });

  it('says the page is not there for a release that does not exist', async () => {
    await renderWithRoutes(ChangelogEntryPage, '/changelog/no-such-release');

    expect(await screen.findByRole('heading')).not.toHaveTextContent('Changelog');
    expect(screen.queryByRole('navigation', { name: 'Other releases' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChangelogEntryPage.displayName).toBe('ChangelogEntryPage');
  });
});
