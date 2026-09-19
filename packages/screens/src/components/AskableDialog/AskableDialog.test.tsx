import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AskableDialog } from './AskableDialog';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import type * as Askable from '@ValenceClient/requests/fetchAskable';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const fetchAskable = vi.fn<typeof Askable.fetchAskable>();
const askForMedia = vi.fn<typeof Requests.askForMedia>();

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchAskable: (...given: Parameters<typeof Askable.fetchAskable>) => fetchAskable(...given),
}));

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  askForMedia: (...given: Parameters<typeof Requests.askForMedia>) => askForMedia(...given),
  fetchSeriesSeasons: () =>
    Promise.resolve([
      { season: 1, episodeCount: 9, firstAired: '2022-02-18' },
      { season: 2, episodeCount: 10, firstAired: '2025-01-17' },
    ]),
}));

const ASKABLE = { status: 'askable', mediaId: null, requestId: null, requestState: null } as const;

/**
 * A title the catalogue describes, with anything a test cares about changed.
 */
const aTitle = (overrides: Partial<CatalogueTitleDetail> = {}): CatalogueTitleDetail => ({
  kind: 'film',
  id: '438631',
  musicBrainzId: null,
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: 'Spice.',
  posterUrl: null,
  backdropUrl: null,
  genres: ['Science Fiction'],
  runtimeMinutes: 155,
  cast: [{ name: 'Zendaya', role: 'Chani', photoUrl: null }],
  albums: [],
  standing: ASKABLE,
  ...overrides,
});

beforeEach(() => {
  fetchAskable.mockReset().mockResolvedValue(aTitle());
  askForMedia.mockReset().mockResolvedValue({ value: aMediaRequest(), refusal: null });
});

/**
 * Opens the dialog on the title given.
 */
const open = (asking = 'film:438631') => {
  const handlers = { onClose: vi.fn(), onOpen: vi.fn() };

  renderInAnAddress(<AskableDialog asking={asking} {...handlers} />);

  return handlers;
};

describe('AskableDialog', () => {
  it('shows what a film is and who is in it, and asks for it', async () => {
    open();

    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('2021 · 2 h 35 min · Science Fiction')).toBeInTheDocument();
    expect(screen.getByText('Zendaya')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631 });
    });
    expect(fetchAskable).toHaveBeenCalledWith('film', '438631');
  });

  it('asks for the seasons of a series chosen', async () => {
    fetchAskable.mockResolvedValue(aTitle({ kind: 'series', id: '95396', title: 'Severance' }));

    open('series:95396');

    await userEvent.click(await screen.findByRole('button', { name: 'Only some seasons' }));

    expect(screen.getByRole('button', { name: 'Request' })).toBeDisabled();

    await userEvent.click(await screen.findByRole('checkbox', { name: /Season 2/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({ kind: 'series', tmdbId: 95396, seasons: [2] });
    });
  });

  it('watches an artist for the kinds of release chosen, or asks for one album', async () => {
    fetchAskable.mockResolvedValue(
      aTitle({
        kind: 'artist',
        id: '83d91898-7763-47d7-b03b-b92132375c47',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        title: 'Pink Floyd',
        cast: [],
        albums: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            title: 'The Wall',
            type: 'album',
            firstReleased: '1979-11-30',
          },
        ],
      }),
    );

    open('artist:deezer-2');

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Live' }));
    await userEvent.click(screen.getByRole('button', { name: 'Watch this artist' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'artist',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        releaseTypes: ['album', 'live'],
      });
    });

    await userEvent.click(
      within(screen.getByRole('region', { name: 'Albums' })).getByRole('button', {
        name: 'Request',
      }),
    );

    await waitFor(() => {
      expect(askForMedia).toHaveBeenLastCalledWith({
        kind: 'album',
        musicBrainzId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      });
    });
    expect(await screen.findByText('Requested')).toBeInTheDocument();
  });

  it('opens what is in the library already, rather than asking for it again', async () => {
    fetchAskable.mockResolvedValue(
      aTitle({
        standing: { status: 'library', mediaId: 'm1', requestId: null, requestState: null },
      }),
    );

    const { onOpen } = open();

    expect(await screen.findByText('In your library')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Request' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(onOpen).toHaveBeenCalledWith('film', 'm1');
  });

  it('says why something could not be asked for', async () => {
    askForMedia.mockResolvedValue({
      value: null,
      refusal: { message: 'There is no library of films to put it in.' },
    });

    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Request' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'There is no library of films to put it in.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AskableDialog.displayName).toBe('AskableDialog');
  });
});
