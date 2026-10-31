import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { dismissDevice } from '@ValenceClient/video/controlledDevice';
import { AVideoRemoteBar } from './AVideoRemoteBar';
import type { VideoRemote } from '@ValenceClient/video/useVideoRemote';
import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

const WATCHING: VideoNowWatching = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
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

const mockRemote: { current: VideoRemote } = {
  current: { device: null, watching: null, positionSeconds: 0, send: mockSend, release: jest.fn() },
};

const mockHeard: { current: 'music' | 'book' | null } = { current: null };

jest.mock('@ValenceClient/video/useVideoRemote', () => ({
  useVideoRemote: () => mockRemote.current,
}));

jest.mock('@ValenceClient/books/useWhatIsHeard', () => ({
  useWhatIsHeard: () => mockHeard.current,
}));

jest.mock('@ValenceClient/video/controlledDevice', () => ({ dismissDevice: jest.fn() }));

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => ({}),
}));

jest.mock('@ValenceMobile/hooks/usePictureLights', () => ({ usePictureLights: () => [] }));

jest.mock('@ValenceMobile/music/thePhonesMusicPlayer', () => ({
  thePhonesMusicPlayer: () => ({}),
}));

const controlling = (watching: VideoNowWatching | null) => {
  mockRemote.current = {
    device: { clientId: 'tv', label: 'Living room' },
    watching,
    positionSeconds: 60,
    send: mockSend,
    release: jest.fn(),
  };
};

beforeEach(() => {
  mockSend.mockClear();
  jest.mocked(dismissDevice).mockClear();
  mockHeard.current = null;
  mockRemote.current = {
    device: null,
    watching: null,
    positionSeconds: 0,
    send: mockSend,
    release: jest.fn(),
  };
});

describe('AVideoRemoteBar', () => {
  it('draws nothing while the phone controls nothing', async () => {
    const drawn = await render(<AVideoRemoteBar onOpen={jest.fn()} />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('says what is playing and where, opening the remote when pressed', async () => {
    controlling(WATCHING);
    const onOpen = jest.fn();
    const drawn = await render(<AVideoRemoteBar onOpen={onOpen} />);

    expect(drawn.getByText('Arrival')).toBeTruthy();
    expect(drawn.getByText('Living room')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Open the remote for Living room'));

    expect(onOpen).toHaveBeenCalled();
  });

  it('pauses the television from the bar', async () => {
    controlling(WATCHING);
    const drawn = await render(<AVideoRemoteBar onOpen={jest.fn()} />);

    await userEvent.press(drawn.getByLabelText('Pause'));

    expect(mockSend).toHaveBeenCalledWith({ kind: 'pause' });
  });

  it('shrinks to a pill naming the television while the phone plays music of its own', async () => {
    controlling(WATCHING);
    mockHeard.current = 'music';
    const onOpen = jest.fn();
    const drawn = await render(<AVideoRemoteBar onOpen={onOpen} />);

    expect(drawn.queryByText('Arrival')).toBeNull();
    expect(drawn.queryByLabelText('Pause')).toBeNull();
    expect(drawn.getByText('Living room')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Open the remote for Living room'));

    expect(onOpen).toHaveBeenCalled();
  });

  it('puts the remote away for a screen reader without stopping the film', async () => {
    controlling(WATCHING);
    const drawn = await render(<AVideoRemoteBar onOpen={jest.fn()} />);

    await fireEvent(
      drawn.getByLabelText('Open the remote for Living room'),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'dismiss' },
      },
    );

    expect(dismissDevice).toHaveBeenCalledWith('tv');
    expect(mockSend).not.toHaveBeenCalled();
  });
});
