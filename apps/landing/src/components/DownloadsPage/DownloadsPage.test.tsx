import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { DownloadsPage } from './DownloadsPage';

describe('DownloadsPage', () => {
  it('opens on what there is to download, then every way to get it', async () => {
    await renderWithRoutes(DownloadsPage, '/downloads');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Valence for every screen' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Download' })).toBeInTheDocument();
    expect(screen.getByText('One compose file')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadsPage.displayName).toBe('DownloadsPage');
  });
});
