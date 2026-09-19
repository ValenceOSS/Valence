import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AskForMediaDialog } from './AskForMediaDialog';
import type * as Admin from '@ValenceClient/admin/fetchAdmin';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const searchCatalogue = vi.fn<typeof Admin.searchCatalogue>();
const askForMedia = vi.fn<typeof Requests.askForMedia>();
const fetchSeriesSeasons = vi.fn<typeof Requests.fetchSeriesSeasons>();
const findReleasesFor = vi.fn<typeof Requests.findReleasesFor>();

vi.mock('@ValenceClient/admin/fetchAdmin', async (actual) => ({
  ...(await actual<object>()),
  searchCatalogue: (...given: Parameters<typeof Admin.searchCatalogue>) =>
    searchCatalogue(...given),
}));

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({
  fetchProfiles: () =>
    Promise.resolve([
      { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', name: 'UHD', kind: 'video' },
      { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', name: 'Lossless', kind: 'music' },
    ]),
}));

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  askForMedia: (...given: Parameters<typeof Requests.askForMedia>) => askForMedia(...given),
  fetchSeriesSeasons: (tmdbId: number) => fetchSeriesSeasons(tmdbId),
  findReleasesFor: (...given: Parameters<typeof Requests.findReleasesFor>) =>
    findReleasesFor(...given),
}));

const RELEASE: Release = {
  id: 'dune-web',
  title: 'Dune.2021.1080p.WEB-DL.x264-GRP',
  indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: null,
  seeders: 12,
  leechers: 3,
  grabs: null,
  publishedAt: null,
  categories: [],
  downloadUrl: null,
  magnetUrl: 'magnet:?xt=urn:btih:abc',
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
};

const MADE = aMediaRequest({ state: 'awaitingApproval', approval: 'awaiting' });

beforeEach(() => {
  searchCatalogue.mockReset().mockImplementation((_query, kind) =>
    Promise.resolve([
      {
        externalId: kind === 'movie' ? '438631' : '95396',
        kind,
        title: kind === 'movie' ? 'Dune' : 'Severance',
        year: kind === 'movie' ? 2021 : 2022,
        overview: null,
        posterUrl: null,
      },
    ]),
  );
  askForMedia.mockReset().mockResolvedValue({ value: MADE, refusal: null });
  findReleasesFor.mockReset().mockResolvedValue({
    value: { releases: [RELEASE], indexers: [], judgements: [], pickedId: null },
    refusal: null,
  });
  fetchSeriesSeasons.mockReset().mockResolvedValue([
    { season: 0, episodeCount: 2, firstAired: null },
    { season: 1, episodeCount: 9, firstAired: '2022-02-18' },
    { season: 2, episodeCount: 10, firstAired: '2025-01-17' },
  ]);
});

/**
 * Opens the dialog.
 */
const open = () => {
  const handlers = { onClose: vi.fn(), onAsked: vi.fn() };

  renderInAnAddress(<AskForMediaDialog isOpen {...handlers} />);

  return handlers;
};

describe('AskForMediaDialog', () => {
  it('finds a film in the catalogue and asks for it, held until it is out on disc', async () => {
    const user = userEvent.setup();
    const { onAsked, onClose } = open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Dune \(2021\)/ }));
    await user.click(screen.getByRole('button', { name: 'Out on disc' }));
    await user.click(screen.getByRole('button', { name: 'Quality' }));

    expect(screen.queryByRole('menuitemradio', { name: 'Lossless' })).not.toBeInTheDocument();

    await user.click(await screen.findByRole('menuitemradio', { name: 'UHD' }));
    await user.click(screen.getByRole('button', { name: 'Ask for it' }));

    await waitFor(() => {
      expect(onAsked).toHaveBeenCalledWith(MADE);
    });
    expect(searchCatalogue).toHaveBeenCalledWith('Dune', 'movie');
    expect(askForMedia).toHaveBeenCalledWith({
      kind: 'film',
      tmdbId: 438631,
      profileId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      isPickedByHand: false,
      waitFor: 'physical',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for the seasons ticked, as the catalogue lists them', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'A series' }));
    await user.type(screen.getByRole('textbox', { name: 'Search for a series' }), 'Severance');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Severance \(2022\)/ }));
    await user.click(screen.getByRole('button', { name: 'Only some seasons' }));

    expect(screen.getByRole('button', { name: 'Ask for it' })).toBeDisabled();

    await user.click(await screen.findByRole('checkbox', { name: /Specials/ }));
    await user.click(screen.getByRole('checkbox', { name: /Season 2/ }));
    await user.click(screen.getByRole('checkbox', { name: /Specials/ }));
    await user.click(screen.getByRole('checkbox', { name: /Season 1/ }));

    expect(screen.getByText('9 episodes · 2022')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ask for it' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'series',
        tmdbId: 95396,
        isPickedByHand: false,
        seasons: [1, 2],
      });
    });
    expect(fetchSeriesSeasons).toHaveBeenCalledWith(95396);
  });

  it('finds releases before asking, and asks only once one is picked', async () => {
    const user = userEvent.setup();
    const { onAsked } = open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Dune \(2021\)/ }));
    await user.click(screen.getByRole('button', { name: 'I will pick it' }));
    await user.click(screen.getByRole('button', { name: 'Find releases' }));

    expect(await screen.findByText(RELEASE.title)).toBeInTheDocument();
    expect(findReleasesFor).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 438631, isPickedByHand: true }),
    );
    expect(askForMedia).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Find releases' }));
    await user.click(await screen.findByRole('button', { name: 'Fetch this' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith(
        expect.objectContaining({ isPickedByHand: true, release: RELEASE }),
      );
    });
    expect(onAsked).toHaveBeenCalled();
  });

  it('says why releases could not be found, making nothing', async () => {
    const user = userEvent.setup();

    findReleasesFor.mockResolvedValue({ value: null, refusal: { message: 'Requesting is off.' } });
    open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Dune \(2021\)/ }));
    await user.click(screen.getByRole('button', { name: 'I will pick it' }));
    await user.click(screen.getByRole('button', { name: 'Find releases' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Requesting is off.');
    expect(askForMedia).not.toHaveBeenCalled();
  });

  it('says why it could not be asked for, and lets another be chosen', async () => {
    const user = userEvent.setup();

    askForMedia.mockResolvedValue({
      value: null,
      refusal: { message: 'There is no library of films to put it in.' },
    });
    open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(await screen.findByRole('button', { name: /Dune \(2021\)/ }));
    await user.click(screen.getByRole('button', { name: 'Ask for it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'There is no library of films to put it in.',
    );

    await user.click(screen.getByRole('button', { name: 'Choose another' }));

    expect(screen.getByRole('textbox', { name: 'Search for a film' })).toBeInTheDocument();
  });

  it('says when the catalogue has nothing under a name', async () => {
    const user = userEvent.setup();

    searchCatalogue.mockResolvedValue([]);
    open();

    await user.type(screen.getByRole('textbox', { name: 'Search for a film' }), 'Nothing');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Nothing came back under that name.')).toBeInTheDocument();
  });
});
