import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ReleaseSearchPanel } from './ReleaseSearchPanel';
import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';
import type * as Indexers from '@ValenceClient/requests/fetchIndexers';

const searchReleases = vi.fn<typeof Indexers.searchReleases>();

vi.mock('@ValenceClient/requests/fetchIndexers', () => ({
  searchReleases: (...given: Parameters<typeof Indexers.searchReleases>) =>
    searchReleases(...given),
  fetchIndexers: vi.fn(),
}));

const JACKETT = '0f8fad5b-d9cb-469f-a165-70867728950e';

/**
 * A release, with anything the test cares about changed.
 */
const aRelease = (title: string, overrides: Partial<Release> = {}): Release => ({
  id: title,
  title,
  indexerId: JACKETT,
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: 8_000_000_000,
  seeders: 40,
  leechers: 3,
  grabs: null,
  publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  categories: [2000],
  downloadUrl: 'http://jackett/dl/1',
  magnetUrl: 'magnet:?xt=urn:btih:abc',
  infoUrl: 'https://tracker.example/details/1',
  infoHash: null,
  ...overrides,
});

const FOUND: ReleaseSearchOutcome = {
  releases: [
    aRelease('Dune.Part.Two.2024.720p', { seeders: 5 }),
    aRelease('Dune.Part.Two.2024.2160p'),
    aRelease('Dune.Part.Two.2024.NZB', {
      protocol: 'usenet',
      seeders: null,
      leechers: null,
      grabs: 3,
      sizeBytes: null,
      publishedAt: null,
      magnetUrl: null,
      infoUrl: null,
      indexerName: 'NZBgeek',
    }),
  ],
  indexers: [
    { indexerId: JACKETT, indexerName: 'Jackett', found: 2, tookMs: 1200, problem: null },
    {
      indexerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      indexerName: 'Flaky',
      found: 0,
      tookMs: 30000,
      problem: 'The indexer did not answer within 30 seconds',
    },
  ],
};

beforeEach(() => {
  searchReleases.mockReset().mockResolvedValue(FOUND);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Searches for the words given.
 */
const searchFor = async (user: ReturnType<typeof userEvent.setup>, words: string) => {
  await user.type(screen.getByRole('searchbox', { name: /Search for/ }), words);
  await user.click(screen.getByRole('button', { name: 'Search' }));
};

describe('ReleaseSearchPanel', () => {
  it('says what it does before anything is searched for', () => {
    renderInAnAddress(<ReleaseSearchPanel />);

    expect(screen.getByText(/Search every enabled indexer at once/)).toBeInTheDocument();
    expect(searchReleases).not.toHaveBeenCalled();
  });

  it('searches every indexer, listing the most widely shared first', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune part two');

    await screen.findByText('Dune.Part.Two.2024.2160p');

    const rows = screen.getAllByRole('row').map((row) => row.textContent);

    expect(rows[1]).toContain('Dune.Part.Two.2024.2160p');
    expect(rows[1]).toContain('40 / 3');
    expect(rows[1]).toContain('3 days');
    expect(rows[1]).toContain('7.5 GB');
    expect(searchReleases).toHaveBeenCalledWith({ query: 'dune part two', mode: 'search' });
  });

  it('says what each indexer found, and why one found nothing', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText('Jackett: 2 in 1.2s')).toBeInTheDocument();
    expect(
      screen.getByText('Flaky: The indexer did not answer within 30 seconds'),
    ).toBeInTheDocument();
  });

  it('shows a usenet release by how often it was fetched', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText('3 grabs')).toBeInTheDocument();
  });

  it('searches for an episode of a series by season and number', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.click(screen.getByRole('button', { name: 'Series' }));
    await user.type(screen.getByRole('spinbutton', { name: /Season/ }), '2');
    await user.type(screen.getByRole('spinbutton', { name: /Episode/ }), '3');
    await searchFor(user, 'severance');

    await waitFor(() => {
      expect(searchReleases).toHaveBeenCalledWith({
        query: 'severance',
        mode: 'tv',
        season: 2,
        episode: 3,
      });
    });
  });

  it('leaves out a season nobody typed', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.click(screen.getByRole('button', { name: 'Series' }));
    await searchFor(user, 'severance');

    await waitFor(() => {
      expect(searchReleases).toHaveBeenCalledWith({ query: 'severance', mode: 'tv' });
    });
  });

  it('searches nothing for no words', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.type(screen.getByRole('searchbox', { name: /Search for/ }), '   {Enter}');

    expect(searchReleases).not.toHaveBeenCalled();
  });

  it('copies a release’s magnet and download links', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Copy the magnet link/ }));

    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe('magnet:?xt=urn:btih:abc');
    });

    await user.click(screen.getByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }));
    await user.click(await screen.findByRole('menuitem', { name: /Copy the download link/ }));

    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe('http://jackett/dl/1');
    });
  });

  it('opens a release’s page somewhere else', async () => {
    const open = vi.fn();

    vi.stubGlobal('open', open);

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Open its page/ }));

    expect(open).toHaveBeenCalledWith(
      'https://tracker.example/details/1',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('says so when no indexer is switched on', async () => {
    searchReleases.mockResolvedValue({ releases: [], indexers: [] });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText(/No indexer is switched on/)).toBeInTheDocument();
  });

  it('says so when nothing was found', async () => {
    searchReleases.mockResolvedValue({ releases: [], indexers: FOUND.indexers });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText(/Nothing was found/)).toBeInTheDocument();
  });

  it('says it could not search, and offers to try again', async () => {
    searchReleases.mockRejectedValue(new Error('offline'));

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReleaseSearchPanel.displayName).toBe('ReleaseSearchPanel');
  });
});
