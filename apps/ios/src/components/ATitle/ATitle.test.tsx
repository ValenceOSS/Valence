import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchMediaDetail } from '@ValenceClient/library/fetchLibrary';
import { fetchWatchProgress } from '@ValenceClient/playback/watchProgress';
import { ATitle } from './ATitle';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import type { ReactNode } from 'react';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

jest.mock('@ValenceClient/library/fetchLibrary');
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
  jest.mocked(fetchWatchProgress).mockReset().mockResolvedValue([]);
});

describe('ATitle', () => {
  it('names the title', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={jest.fn()} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Arrival')).toBeTruthy();
    });
  });

  it('says how long it runs', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={jest.fn()} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('1h 56m')).toBeTruthy();
    });
  });

  it('says what it is about', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={jest.fn()} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Linguists meet a ship.')).toBeTruthy();
    });
  });

  it('offers to play it, and says which one', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const onWatch = jest.fn();
    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={onWatch} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Watch')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Watch'));

    expect(onWatch).toHaveBeenCalledWith('3fa85f64-5717-4562-b3fc-2c963f66afa6', 0);
  });

  it('says so where the title could not be read', async () => {
    jest.mocked(fetchMediaDetail).mockRejectedValue(new Error('gone'));

    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={jest.fn()} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('That title could not be read.')).toBeTruthy();
    });
  });

  it('offers a way back', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());

    const onBack = jest.fn();
    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={jest.fn()} onBack={onBack} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Back')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Back'));

    expect(onBack).toHaveBeenCalled();
  });

  it('offers to carry on where they got part way through', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(4200);

    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={jest.fn()} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Carry on from 1h 10m')).toBeTruthy();
    });
  });

  it('starts them where they left, not at the beginning', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(4200);

    const onWatch = jest.fn();
    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={onWatch} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Carry on from 1h 10m')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Carry on from 1h 10m'));

    expect(onWatch).toHaveBeenCalledWith('3fa85f64-5717-4562-b3fc-2c963f66afa6', 4200);
  });

  it('still lets them start again, which is a thing they have to ask for', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(4200);

    const onWatch = jest.fn();
    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={onWatch} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Start again')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Start again'));

    expect(onWatch).toHaveBeenCalledWith('3fa85f64-5717-4562-b3fc-2c963f66afa6', 0);
  });

  it('says nothing about carrying on where they barely started', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(detailOf());
    partWayThrough(3);

    const drawn = await render(
      around(<ATitle mediaId="one" onWatch={jest.fn()} onBack={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Watch')).toBeTruthy();
    });

    expect(drawn.queryByText('Start again')).toBeNull();
  });
});
