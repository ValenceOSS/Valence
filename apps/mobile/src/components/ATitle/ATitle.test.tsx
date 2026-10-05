import { ActionSheetIOS } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchLibraries, fetchMediaDetail } from '@ValenceClient/library/fetchLibrary';
import { fetchLinkedServerFaces } from '@ValenceClient/linking/fetchLinkedServerFaces';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { fetchWatchProgress } from '@ValenceClient/playback/watchProgress';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { ATitle } from './ATitle';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import type { ReactNode } from 'react';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

jest.mock('@ValenceClient/library/fetchLibrary');
jest.mock('@ValenceClient/linking/fetchLinkedServerFaces');
jest.mock('@ValenceClient/playback/markWatched', () => ({ markWatched: jest.fn() }));
jest.mock('@ValenceClient/playback/watchProgress', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/watchProgress'),
  fetchWatchProgress: jest.fn(),
}));

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const detailOf = (overrides: Partial<MediaDetail> = {}): MediaDetail =>
  MediaDetailSchema.parse({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: 'Arrival',
    year: 2016,
    container: 'mkv',
    durationSeconds: 6960,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    width: 3840,
    height: 2160,
    bitrateKbps: 12000,
    audioStreams: [
      { index: 1, codec: 'eac3', channels: 6, language: 'eng', isDefault: true, isAtmos: false },
    ],
    subtitleStreams: [],
    addedAt: '2026-01-01T00:00:00.000Z',
    metadata: {
      overview: 'Linguists meet a ship.',
      hasPoster: true,
      hasBackdrop: false,
      hasLogo: false,
    },
    ...overrides,
  });

const partWayThrough = (positionSeconds: number) => {
  jest.mocked(fetchWatchProgress).mockResolvedValue([
    {
      mediaId: 'one',
      positionSeconds,
      durationSeconds: 6960,
      isFinished: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]);
};

beforeEach(() => {
  jest.mocked(fetchMediaDetail).mockReset();
  jest.mocked(fetchLibraries).mockReset().mockResolvedValue([]);
  jest.mocked(fetchLinkedServerFaces).mockReset().mockResolvedValue([]);
  jest.mocked(fetchWatchProgress).mockReset().mockResolvedValue([]);
});

describe('ATitle', () => {
  it('names the title', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getAllByText('Arrival').length).toBeGreaterThan(0);
    });
  });

  it('says how long it runs', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText(/1h 56m/)).toBeTruthy();
    });
  });

  it('says what it is about', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Linguists meet a ship.')).toBeTruthy();
    });
  });

  it('offers to play it, and says which one', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const onWatch = jest.fn();
    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={onWatch}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Play')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Play'));

    expect(onWatch).toHaveBeenCalledWith('one', 0);
  });

  it('says so where the title could not be read', async () => {
    jest.mocked(fetchMediaDetail).mockRejectedValue(new Error('gone'));

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Couldn’t load that title.')).toBeTruthy();
    });
  });

  it('offers a way back', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const onBack = jest.fn();
    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={onBack}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Back')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Back'));

    expect(onBack).toHaveBeenCalled();
  });

  it('offers to carry on where they got part way through', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(4200);

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Resume from 1h 10m')).toBeTruthy();
    });
  });

  it('starts them where they left, not at the beginning', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(4200);

    const onWatch = jest.fn();
    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={onWatch}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Resume from 1h 10m')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Resume from 1h 10m'));

    expect(onWatch).toHaveBeenCalledWith('one', 4200);
  });

  it('still lets them start again, which is a thing they have to ask for', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(4200);

    const onWatch = jest.fn();
    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={onWatch}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Start again')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Start again'));

    expect(onWatch).toHaveBeenCalledWith('one', 0);
  });

  it('says nothing about carrying on where they barely started', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(3);

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Play')).toBeTruthy();
    });

    expect(drawn.queryByText('Start again')).toBeNull();
  });

  it('says which linked server a title comes from', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    jest
      .mocked(fetchLibraries)
      .mockResolvedValue([
        aLibrary({ id: detailOf().libraryId, linkedServerId: aLinkedServerFace().id }),
      ]);
    jest.mocked(fetchLinkedServerFaces).mockResolvedValue([aLinkedServerFace()]);

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    expect(await drawn.findByText('From Films')).toBeTruthy();
  });

  it('marks it watched from the menu beside Play', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    jest.mocked(markWatched).mockResolvedValue();
    const sheet = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_options, picked) => {
        picked(0);
      });

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await userEvent.press(await drawn.findByLabelText('More'));

    const [asked] = sheet.mock.calls[0] ?? [];
    const [marked, isWatched] = jest.mocked(markWatched).mock.calls[0] ?? [];

    expect(asked?.options).toEqual([`Mark ${detailOf().title} as watched`, 'Hide', 'Cancel']);
    expect(marked?.map((item) => item.id)).toEqual([detailOf().id]);
    expect(isWatched).toBe(true);
  });

  it('starts a watch party on it, where the phone can', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_options, picked) => {
        picked(1);
      });
    const onStartParty = jest.fn();

    const drawn = await render(
      around(
        <ATitle
          mediaId="one"
          onWatch={jest.fn()}
          onLookAtPerson={jest.fn()}
          onLookAtShow={jest.fn()}
          onBack={jest.fn()}
          onStartParty={onStartParty}
        />,
      ),
    );

    await userEvent.press(await drawn.findByLabelText('More'));

    expect(onStartParty).toHaveBeenCalledWith('one', 0);
  });
});
