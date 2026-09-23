import { act, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { z } from 'zod';
import { PreviewBackdrop } from '@ValenceTv/components/PreviewBackdrop/PreviewBackdrop';
import { aFakeVideoPlayer } from '@ValenceTv/testing/aFakeVideoPlayer';

const mockReadPreviewState = jest.fn<Promise<'ready' | 'pending' | 'absent'>, [string]>();

let mockPlayer = aFakeVideoPlayer();

jest.mock('expo-video', () => ({
  useVideoPlayer: () => mockPlayer,
  VideoView: () => null,
}));

jest.mock('@ValenceClient/playback/readPreviewState', () => ({
  readPreviewState: (url: string) => mockReadPreviewState(url),
}));

const MEDIA_ID = '00000000-0000-4000-8000-000000000001';

const PREVIEW = `/api/media/${MEDIA_ID}/preview`;

const runsInJavaScript = Animated.timing;

const SourceSchema = z.array(z.object({ uri: z.string() }));

const settle = async (): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(2500);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('PreviewBackdrop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPlayer = aFakeVideoPlayer();
    mockReadPreviewState.mockReset();
    mockReadPreviewState.mockResolvedValue('ready');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows the still at once', async () => {
    const drawn = await render(
      <PreviewBackdrop mediaId={MEDIA_ID} stillPath="/api/media/1/image/backdrop" isPlaying />,
    );
    const [still] =
      drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? [];

    expect(SourceSchema.parse(still?.props.source)).toEqual([
      expect.objectContaining({ uri: '/api/media/1/image/backdrop' }),
    ]);
  });

  it('does not ask for the preview until the still has settled', async () => {
    await render(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying />);

    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockReadPreviewState).not.toHaveBeenCalled();
  });

  it('plays the preview once the still has settled and the server has one', async () => {
    await render(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying />);

    await settle();

    expect(mockReadPreviewState).toHaveBeenCalledWith(PREVIEW);
    expect(mockPlayer.replaceAsync).toHaveBeenCalledWith(expect.objectContaining({ uri: PREVIEW }));
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('stays a still where the preview is not ready', async () => {
    mockReadPreviewState.mockResolvedValue('pending');

    await render(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying />);

    await settle();

    expect(mockPlayer.replaceAsync).not.toHaveBeenCalled();
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('plays nothing while it is covered', async () => {
    await render(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying={false} />);

    await settle();

    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(mockReadPreviewState).not.toHaveBeenCalled();
  });

  it('forgets the preview when covered before the still has settled', async () => {
    const drawn = await render(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying />);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    await drawn.rerender(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying={false} />);

    await settle();

    expect(mockReadPreviewState).not.toHaveBeenCalled();
  });

  it('plays a preview it has already loaded again without asking for it again', async () => {
    const drawn = await render(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying />);

    await settle();

    await drawn.rerender(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying={false} />);

    expect(mockPlayer.pause).toHaveBeenCalled();

    await drawn.rerender(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying />);

    await settle();

    expect(mockReadPreviewState).toHaveBeenCalledTimes(1);
    expect(mockPlayer.replaceAsync).toHaveBeenCalledTimes(1);
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
  });

  it('fades the preview in over the still once it is playing, and out as it stops', async () => {
    jest
      .spyOn(Animated, 'timing')
      .mockImplementation((value, config) =>
        runsInJavaScript(value, { ...config, useNativeDriver: false }),
      );
    const drawn = await render(<PreviewBackdrop mediaId={MEDIA_ID} stillPath={null} isPlaying />);
    const [, preview] =
      drawn.root?.children.flatMap((part) => (typeof part === 'string' ? [] : [part])) ?? [];

    expect(preview).toHaveStyle({ opacity: 0 });

    await act(() => {
      mockPlayer.tell('playingChange', { isPlaying: true });
      jest.advanceTimersByTime(1000);
    });

    expect(preview).toHaveStyle({ opacity: 1 });

    await act(() => {
      mockPlayer.tell('playingChange', { isPlaying: false });
      jest.advanceTimersByTime(1000);
    });

    expect(preview).toHaveStyle({ opacity: 0 });
  });
});
