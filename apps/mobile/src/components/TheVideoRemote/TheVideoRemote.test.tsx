import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { z } from 'zod';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { TheVideoRemote } from './TheVideoRemote';
import type { VideoRemote } from '@ValenceClient/video/useVideoRemote';
import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

const WATCHING: VideoNowWatching = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: false,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  hasNext: false,
  settings: [],
  skip: null,
  stepsBy: null,
  canStepOn: false,
  canStepBack: false,
  reportedAtMs: 1,
};

const mockSend = jest.fn();

const mockRelease = jest.fn();

const mockRemote: { current: VideoRemote } = {
  current: {
    device: null,
    watching: null,
    positionSeconds: 0,
    send: mockSend,
    release: mockRelease,
  },
};

jest.mock('@ValenceClient/video/useVideoRemote', () => ({
  useVideoRemote: () => mockRemote.current,
}));

jest.mock('@ValenceMobile/hooks/usePictureLights', () => ({ usePictureLights: () => [] }));

const mockServer = { hasBarePosters: true };

jest.mock('@ValenceClient/about/useServerHas', () => ({
  useServerHas: () => mockServer.hasBarePosters,
}));

const SourceSchema = z.object({ uri: z.string() }).or(z.array(z.object({ uri: z.string() })));

type Drawn = Awaited<ReturnType<typeof render>>;

const theBackground = async (drawn: Drawn) =>
  waitFor(() => {
    const [picture] = drawn.root?.queryAll((node) => node.type === 'Image') ?? [];

    if (picture === undefined) {
      throw new Error('No picture yet');
    }

    return picture;
  });

const addressOf = (picture: Awaited<ReturnType<typeof theBackground>>) => {
  const source = SourceSchema.parse(picture.props.source);

  return Array.isArray(source) ? source[0]?.uri : source.uri;
};

const controlling = (watching: VideoNowWatching) => {
  mockRemote.current = {
    device: { clientId: 'tv', label: 'Living room' },
    watching,
    positionSeconds: 600,
    send: mockSend,
    release: mockRelease,
  };
};

const draw = () => {
  const onBack = jest.fn();
  const onPlayHere = jest.fn();
  const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  cache.setQueryData(libraryQueries.detail(WATCHING.mediaId).queryKey, null);

  return render(
    <QueryClientProvider client={cache}>
      <TheVideoRemote onBack={onBack} onPlayHere={onPlayHere} />
    </QueryClientProvider>,
  ).then((drawn) => ({ drawn, onBack, onPlayHere }));
};

beforeEach(() => {
  mockServer.hasBarePosters = true;
  mockSend.mockClear();
  mockRelease.mockClear();
});

describe('TheVideoRemote', () => {
  it('says which television it is the remote for, and what is playing', async () => {
    controlling(WATCHING);
    const { drawn } = await draw();

    expect(drawn.getByText('10:00')).toBeTruthy();
    expect(drawn.getByText('−1:30:00')).toBeTruthy();

    expect(drawn.getByText('Living room')).toBeTruthy();
    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('shows the film’s poster with no lettering, since its own logo is written below', async () => {
    controlling(WATCHING);
    const { drawn } = await draw();

    expect(addressOf(await theBackground(drawn))).toMatch(
      new RegExp(`/api/media/${WATCHING.mediaId}/image/poster\\?lettering=none$`, 'u'),
    );
  });

  it('shows the backdrop where the server is too old to pick out a poster without lettering', async () => {
    mockServer.hasBarePosters = false;
    controlling(WATCHING);
    const { drawn } = await draw();

    expect(addressOf(await theBackground(drawn))).toMatch(/\/image\/backdrop\?size=medium$/u);
  });

  it('shows the backdrop where the film has no poster without lettering', async () => {
    controlling(WATCHING);
    const { drawn } = await draw();

    await fireEvent(await theBackground(drawn), 'error');

    await waitFor(async () => {
      expect(addressOf(await theBackground(drawn))).toMatch(/\/image\/backdrop\?size=medium$/u);
    });
  });

  it('stops the film on the television from its corner, and goes back down', async () => {
    controlling(WATCHING);
    const { drawn, onBack } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Stop' }));

    expect(mockSend).toHaveBeenCalledWith({ kind: 'stop' });
    expect(onBack).toHaveBeenCalled();
  });

  it('plays, pauses and jumps on the television', async () => {
    controlling(WATCHING);
    const { drawn } = await draw();

    await userEvent.press(drawn.getByLabelText('Pause'));
    await userEvent.press(drawn.getByLabelText('Back 10 seconds'));
    await userEvent.press(drawn.getByLabelText('Forward 10 seconds'));

    expect(mockSend.mock.calls).toEqual([
      [{ kind: 'pause' }],
      [{ kind: 'skip', seconds: -10 }],
      [{ kind: 'skip', seconds: 10 }],
    ]);
  });

  it('steps back and on through the episodes of a programme', async () => {
    controlling({ ...WATCHING, stepsBy: 'episode', canStepOn: true, canStepBack: true });
    const { drawn } = await draw();

    await userEvent.press(drawn.getByLabelText('Previous Episode'));
    await userEvent.press(drawn.getByLabelText('Next Episode'));

    expect(mockSend.mock.calls).toEqual([
      [{ kind: 'step', toward: 'back' }],
      [{ kind: 'step', toward: 'on' }],
    ]);
  });

  it('greys out the episode before the first and after the last', async () => {
    controlling({ ...WATCHING, stepsBy: 'episode', canStepOn: false, canStepBack: false });
    const { drawn } = await draw();

    await userEvent.press(drawn.getByLabelText('Previous Episode'));
    await userEvent.press(drawn.getByLabelText('Next Episode'));

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('steps through the chapters of a film that has them, and not past the last', async () => {
    controlling({ ...WATCHING, stepsBy: 'chapter', canStepOn: false, canStepBack: true });
    const { drawn } = await draw();

    await userEvent.press(drawn.getByLabelText('Previous chapter'));
    await userEvent.press(drawn.getByLabelText('Next chapter'));

    expect(mockSend.mock.calls).toEqual([[{ kind: 'step', toward: 'back' }]]);
  });

  it('starts a film with no chapters over, as a television of any age can', async () => {
    controlling(WATCHING);
    const { drawn } = await draw();

    await userEvent.press(drawn.getByLabelText('Start Over'));

    expect(mockSend).toHaveBeenCalledWith({ kind: 'seek', positionSeconds: 0 });
  });

  it('goes on to the next episode on a television too old to step', async () => {
    controlling({ ...WATCHING, hasNext: true });
    const { drawn } = await draw();

    await userEvent.press(drawn.getByLabelText('Next Episode'));

    expect(mockSend).toHaveBeenCalledWith({ kind: 'next' });
  });

  it('chooses the television’s subtitles from the player’s own panel', async () => {
    controlling({
      ...WATCHING,
      settings: [
        {
          setting: 'subtitles',
          chosen: 'off',
          choices: [
            { id: 'off', label: 'Off' },
            { id: 'eng-1', label: 'English' },
          ],
        },
        {
          setting: 'quality',
          chosen: 'original',
          choices: [{ id: 'original', label: 'Original (1080p)', short: '1080p' }],
        },
      ],
    });
    const { drawn } = await draw();

    expect(drawn.getByLabelText('Quality, 1080p')).toBeTruthy();
    expect(drawn.queryByText('Speed')).toBeNull();

    await userEvent.press(drawn.getByLabelText('Subtitles, Off'));
    await userEvent.press(drawn.getByRole('button', { name: 'English' }));

    expect(mockSend).toHaveBeenCalledWith({
      kind: 'choose',
      setting: 'subtitles',
      choiceId: 'eng-1',
    });
  });

  it('skips the opening while the television offers to', async () => {
    controlling({ ...WATCHING, skip: { label: 'Skip Intro', toSeconds: 95 } });
    const { drawn } = await draw();

    await userEvent.press(drawn.getByText('Skip Intro'));

    expect(mockSend).toHaveBeenCalledWith({ kind: 'seek', positionSeconds: 95 });
  });

  it('goes back down by itself, once, when the television stops', async () => {
    controlling(WATCHING);
    const { drawn, onBack } = await draw();

    mockRemote.current = { ...mockRemote.current, device: null, watching: null };
    await drawn.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TheVideoRemote onBack={onBack} onPlayHere={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('stops the film on the television when it is brought back to play here', async () => {
    controlling(WATCHING);
    const { drawn, onPlayHere } = await draw();

    await userEvent.press(drawn.getByLabelText('Play here'));

    expect(mockSend).toHaveBeenCalledWith({ kind: 'stop' });
    expect(mockRelease).toHaveBeenCalled();
    expect(onPlayHere).toHaveBeenCalledWith(WATCHING.mediaId, 600);
  });

  it('goes back only once when it lets go of the television to play here', async () => {
    controlling(WATCHING);
    const { drawn, onBack } = await draw();

    await userEvent.press(drawn.getByLabelText('Play here'));

    mockRemote.current = { ...mockRemote.current, device: null, watching: null };
    await drawn.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TheVideoRemote onBack={onBack} onPlayHere={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('offers no stop before the television has said what it is playing', async () => {
    controlling(WATCHING);
    mockRemote.current = { ...mockRemote.current, watching: null };
    const { drawn } = await draw();

    expect(drawn.queryByRole('button', { name: 'Stop' })).toBeNull();
  });

  it('names the sound button for the sound where the television offers no subtitles', async () => {
    controlling({
      ...WATCHING,
      settings: [
        {
          setting: 'audio',
          chosen: 'en',
          choices: [
            { id: 'en', label: 'English' },
            { id: 'fr', label: 'French' },
          ],
        },
      ],
    });
    const { drawn } = await draw();

    expect(drawn.getByRole('button', { name: 'Audio, English' })).toBeTruthy();
  });
});
