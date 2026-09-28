import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { phonesAndAudiobooks } from '@ValenceLanding/content/changelog/phonesAndAudiobooks';
import { theFirstRelease } from '@ValenceLanding/content/changelog/theFirstRelease';
import { ChangelogSummary } from './ChangelogSummary';

describe('ChangelogSummary', () => {
  it('leads its title and its picture to the release’s own page', async () => {
    await renderWithRoutes(() => (
      <ul>
        <ChangelogSummary entry={phonesAndAudiobooks} index={0} />
      </ul>
    ));

    expect(
      await screen.findByRole('link', { name: 'Valence on your phone, and audiobooks' }),
    ).toHaveAttribute('href', '/changelog/phones-and-audiobooks');
    expect(
      screen.getByRole('img', { hidden: true, name: /phone app open on its home page/u }),
    ).toBeInTheDocument();
    expect(screen.getByText(phonesAndAudiobooks.summary)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read about v1\.1\.0/u })).toBeInTheDocument();
  });

  it('goes without a picture where the release has none', async () => {
    await renderWithRoutes(() => (
      <ul>
        <ChangelogSummary entry={theFirstRelease} index={0} />
      </ul>
    ));

    expect(await screen.findByRole('link', { name: 'The first release' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChangelogSummary.displayName).toBe('ChangelogSummary');
  });
});
