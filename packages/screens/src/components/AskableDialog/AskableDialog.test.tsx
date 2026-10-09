import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AskableDialog } from './AskableDialog';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import type * as Askable from '@ValenceClient/requests/fetchAskable';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';
import type { ProfilesOnOffer } from '@ValenceContracts/schemas/QualityProfile';
import type * as Linked from '@ValenceClient/linking/askLinkedServer';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';

const fetchAskable = vi.fn<typeof Askable.fetchAskable>();
const requested = vi.hoisted((): { requests: MediaRequest[] } => ({ requests: [] }));
const askForMedia = vi.fn<typeof Requests.askForMedia>();
const joinMediaRequest = vi.fn<typeof Requests.joinMediaRequest>();
const fetchProfilesOnOffer = vi.fn<() => Promise<ProfilesOnOffer>>();

const aQuality = (id: string, name: string) => ({ id, name, kind: 'video' as const });

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () =>
    Promise.resolve({ isEnabled: true, kinds: ['film', 'series', 'artist', 'album', 'book'] }),
  fetchRequestsOverview: vi.fn(),
}));

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchAskable: (...given: Parameters<typeof Askable.fetchAskable>) => fetchAskable(...given),
}));

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({
  fetchProfilesOnOffer: () => fetchProfilesOnOffer(),
}));

const fetchLinkedServerFaces = vi.fn<() => Promise<LinkedServerFace[]>>();
const askLinkedServer = vi.fn<typeof Linked.askLinkedServer>();

vi.mock('@ValenceClient/linking/fetchLinkedServerFaces', () => ({
  fetchLinkedServerFaces: () => fetchLinkedServerFaces(),
}));

vi.mock('@ValenceClient/linking/askLinkedServer', () => ({
  askLinkedServer: (...given: Parameters<typeof Linked.askLinkedServer>) =>
    askLinkedServer(...given),
}));

vi.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () =>
    Promise.resolve({ id: 'me', name: 'Me', email: 'me@valence.local', emailVerified: true }),
}));

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  askForMedia: (...given: Parameters<typeof Requests.askForMedia>) => askForMedia(...given),
  joinMediaRequest: (...given: Parameters<typeof Requests.joinMediaRequest>) =>
    joinMediaRequest(...given),
  fetchMediaRequests: () => Promise.resolve(requested.requests),
  fetchSeriesSeasons: () =>
    Promise.resolve([
      { season: 1, episodeCount: 9, firstAired: '2022-02-18', standing: 'askable' },
      { season: 2, episodeCount: 10, firstAired: '2025-01-17', standing: 'askable' },
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
  authors: [],
  trailerKey: null,
  standing: ASKABLE,
  ...overrides,
});

beforeEach(() => {
  requested.requests = [];
  fetchAskable.mockReset().mockResolvedValue(aTitle());
  askForMedia.mockReset().mockResolvedValue({ value: aMediaRequest(), refusal: null });
  joinMediaRequest.mockReset().mockResolvedValue({ value: aMediaRequest(), refusal: null });
  fetchProfilesOnOffer.mockReset().mockResolvedValue({ choices: [], forcedId: null });
  fetchLinkedServerFaces.mockReset().mockResolvedValue([]);
  askLinkedServer
    .mockReset()
    .mockResolvedValue({ value: { title: 'Dune', isNew: true }, refusal: null });
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
  it('shows a book with its author and subjects, and asks for it by its Open Library number', async () => {
    fetchAskable.mockResolvedValue(
      aTitle({
        kind: 'book',
        id: '21277329',
        title: 'Project Hail Mary',
        subtitle: 'Andy Weir',
        year: 2021,
        runtimeMinutes: null,
        genres: ['Science fiction'],
        cast: [],
        authors: ['Andy Weir'],
      }),
    );

    open('book:21277329');

    expect(await screen.findByRole('heading', { name: 'Project Hail Mary' })).toBeInTheDocument();
    expect(screen.getByText('Andy Weir · 2021 · Science fiction')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'book',
        openLibraryId: 21_277_329,
        bookFormats: ['ebook'],
      });
    });
  });

  it('asks for a book as an audiobook too, where that is ticked', async () => {
    fetchAskable.mockResolvedValue(
      aTitle({ kind: 'book', id: '21277329', title: 'A Book', authors: [] }),
    );

    open('book:21277329');

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Audiobook' }));
    await userEvent.click(screen.getByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'book',
        openLibraryId: 21_277_329,
        bookFormats: ['ebook', 'audiobook'],
      });
    });
  });

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

  it('splits an artist’s releases by what each one is', async () => {
    fetchAskable.mockResolvedValue(
      aTitle({
        kind: 'artist',
        id: '83d91898-7763-47d7-b03b-b92132375c47',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        title: 'Pink Floyd',
        albums: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd43001',
            title: 'Another Brick',
            type: 'single',
            firstReleased: '1979-11-23',
          },
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd43002',
            title: 'The Wall',
            type: 'album',
            firstReleased: '1979-11-30',
          },
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd43003',
            title: 'Pulse',
            type: 'live',
            firstReleased: '1995-05-29',
          },
        ],
      }),
    );

    open('artist:83d91898-7763-47d7-b03b-b92132375c47');

    const albums = await screen.findByRole('region', { name: 'Albums' });

    expect(within(albums).getByText('The Wall')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Singles' })).getByText('Another Brick'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Live' })).getByText('Pulse'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'EPs' })).not.toBeInTheDocument();
  });

  it('plays the trailer of something not in the library yet', async () => {
    fetchAskable.mockResolvedValue(aTitle({ trailerKey: 'abc123' }));

    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Watch the trailer' }));

    const playing = await screen.findByRole('dialog', { name: 'Dune trailer' });

    expect(within(playing).getByTitle('Dune trailer')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abc123?rel=0&modestbranding=1',
    );
  });

  it('offers no trailer where the catalogue knows of none', async () => {
    open();

    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Watch the trailer' })).not.toBeInTheDocument();
  });

  it('asks which quality to look for, once there is more than one to choose between', async () => {
    fetchProfilesOnOffer.mockResolvedValue({
      choices: [aQuality('uhd', '4K'), aQuality('hd', '1080p')],
      forcedId: null,
    });

    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Request' }));
    await userEvent.click(await screen.findByRole('button', { name: '1080p' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'film',
        tmdbId: 438631,
        profileId: 'hd',
      });
    });
  });

  it('does not ask where there is only one quality to ask at', async () => {
    fetchProfilesOnOffer.mockResolvedValue({ choices: [aQuality('hd', '1080p')], forcedId: null });

    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631 });
    });
  });

  it('does not ask where the server asks at one quality and no other', async () => {
    fetchProfilesOnOffer.mockResolvedValue({
      choices: [aQuality('hd', '1080p'), aQuality('uhd', '4K')],
      forcedId: 'hd',
    });

    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631 });
    });
  });

  it('asks for nothing when the quality prompt is dismissed', async () => {
    fetchProfilesOnOffer.mockResolvedValue({
      choices: [aQuality('uhd', '4K'), aQuality('hd', '1080p')],
      forcedId: null,
    });

    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Request' }));

    const prompt = await screen.findByRole('dialog', { name: 'Which quality for Dune?' });

    expect(within(prompt).getByRole('heading', { name: 'Request Dune' })).toBeInTheDocument();

    await userEvent.click(within(prompt).getByRole('button', { name: 'Close' }));

    expect(askForMedia).not.toHaveBeenCalled();
  });

  it('asks for the seasons of a series chosen', async () => {
    fetchAskable.mockResolvedValue(aTitle({ kind: 'series', id: '95396', title: 'Severance' }));

    open('series:95396');

    await userEvent.click(await screen.findByRole('switch', { name: 'Every season' }));

    expect(screen.getByRole('button', { name: 'Request' })).toBeDisabled();

    await userEvent.click(screen.getByRole('switch', { name: 'Season 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'series',
        tmdbId: 95396,
        seasons: [2],
        followsNewSeasons: true,
      });
    });
  });

  it('asks for a series without new seasons where they are not wanted', async () => {
    fetchAskable.mockResolvedValue(aTitle({ kind: 'series', id: '95396', title: 'Severance' }));

    open('series:95396');

    await userEvent.click(
      await screen.findByRole('switch', { name: 'Get new seasons as they come' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'series',
        tmdbId: 95396,
        seasons: null,
        followsNewSeasons: false,
      });
    });
  });

  it('adds seasons to a series already asked for', async () => {
    const request = aMediaRequest({
      id: '6ba7b810-9dad-11d1-80b4-00c04fd43011',
      kind: 'series',
      tmdbId: 95396,
      seasons: [1],
      items: [aRequestItem({ season: 1, episode: 1 })],
    });

    requested.requests = [request];
    fetchAskable.mockResolvedValue(
      aTitle({
        kind: 'series',
        id: '95396',
        title: 'Severance',
        standing: {
          status: 'requested',
          mediaId: null,
          requestId: request.id,
          requestState: 'waiting',
        },
      }),
    );

    open('series:95396');

    const first = await screen.findByRole('switch', { name: 'Season 1' });

    await waitFor(() => {
      expect(first).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Add seasons' })).toBeDisabled();

    await userEvent.click(screen.getByRole('switch', { name: 'Season 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add seasons' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'series',
        tmdbId: 95396,
        seasons: [2],
        followsNewSeasons: false,
      });
    });
  });

  it('names who asked for somebody else’s request, and wants it too', async () => {
    const requestId = '6ba7b810-9dad-11d1-80b4-00c04fd43012';

    fetchAskable.mockResolvedValue(
      aTitle({
        standing: {
          status: 'requested',
          mediaId: null,
          requestId,
          requestState: 'wanted',
          askedBy: [
            { id: 'p', name: 'Priya' },
            { id: 's', name: 'Sam' },
          ],
        },
      }),
    );

    open();

    expect(await screen.findByText('Requested by Priya and Sam')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'I want this too' }));

    expect(joinMediaRequest).toHaveBeenCalledWith(requestId);
    expect(askForMedia).not.toHaveBeenCalled();
  });

  it('says who else wants your own request, and offers nothing more to join', async () => {
    const request = aMediaRequest({
      id: '6ba7b810-9dad-11d1-80b4-00c04fd43013',
      requestedBy: { id: 'p', name: 'Priya' },
      alsoAskedBy: [{ id: 'me', name: 'Me' }],
      state: 'wanted',
    });

    requested.requests = [request];
    fetchAskable.mockResolvedValue(
      aTitle({
        standing: {
          status: 'requested',
          mediaId: null,
          requestId: request.id,
          requestState: 'wanted',
          askedBy: [
            { id: 'p', name: 'Priya' },
            { id: 'me', name: 'Me' },
          ],
        },
      }),
    );

    open();

    expect(await screen.findByText('Priya wants it too')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'I want this too' })).toBeNull();

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel request' }));

    expect(
      await screen.findByText('Priya still wants it, so it stays requested for them.'),
    ).toBeInTheDocument();
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
    await userEvent.click(screen.getByRole('button', { name: 'Request this artist' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'artist',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        releaseTypes: ['album', 'mixtape', 'ep', 'live'],
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

  it('asks for more of a show already in the library, where the address says so', async () => {
    const handlers = { onClose: vi.fn(), onOpen: vi.fn() };

    fetchAskable.mockResolvedValue(
      aTitle({
        kind: 'series',
        id: '95396',
        title: 'Severance',
        standing: { status: 'library', mediaId: 'show-1', requestId: null, requestState: null },
      }),
    );

    renderInAnAddress(<AskableDialog asking="series:95396:more" {...handlers} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Request' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'series', tmdbId: 95396 }),
      );
    });
    expect(handlers.onOpen).not.toHaveBeenCalled();
  });

  it('opens what is in the library already in its own dialog, without showing this one', async () => {
    fetchAskable.mockResolvedValue(
      aTitle({
        standing: { status: 'library', mediaId: 'm1', requestId: null, requestState: null },
      }),
    );

    const { onOpen } = open();

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith('film', 'm1');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument();
  });

  it('says why something could not be asked for', async () => {
    askForMedia.mockResolvedValue({
      value: null,
      refusal: { message: 'There’s no films library to put it in.' },
    });

    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Request' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'There’s no films library to put it in.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AskableDialog.displayName).toBe('AskableDialog');
  });

  it('offers to watch a title a linked server has, or to request it here anyway', async () => {
    fetchAskable.mockResolvedValue(
      aTitle({
        standing: { ...ASKABLE, status: 'linked', mediaId: 'theirs', fromServer: 'Films' },
      }),
    );
    const { onOpen } = open();

    await userEvent.click(await screen.findByRole('button', { name: 'Watch on Films' }));

    expect(onOpen).toHaveBeenCalledWith('film', 'theirs');

    await userEvent.click(screen.getByRole('button', { name: 'Request here' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledOnce();
    });
  });

  it('asks a linked server that takes requests for a film', async () => {
    fetchLinkedServerFaces.mockResolvedValue([
      aLinkedServerFace({ takesRequests: true }),
      aLinkedServerFace({
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Away',
        takesRequests: true,
        isReachable: false,
      }),
    ]);
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'Ask Films' }));

    await waitFor(() => {
      expect(askLinkedServer).toHaveBeenCalledWith(
        aLinkedServerFace().id,
        expect.objectContaining({ kind: 'film', tmdbId: 438631 }),
      );
    });
    expect(screen.queryByRole('button', { name: 'Ask Away' })).toBeNull();
  });
});
