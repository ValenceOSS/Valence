import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';

type MockImageProps = {
  source: { uri: string; headers: Record<string, string> };
  onError?: () => void;
};

const mockDrawnImage = jest.fn<undefined, [MockImageProps]>();

jest.mock('expo-image', () => ({
  Image: (props: MockImageProps) => {
    mockDrawnImage(props);

    return mockCreateElement(mockNativeImage, {
      source: { uri: props.source.uri },
      accessible: true,
      accessibilityRole: 'image',
      accessibilityLabel: props.source.uri,
      onError: props.onError,
    });
  },
}));

describe('Artwork', () => {
  beforeEach(() => {
    mockDrawnImage.mockClear();
    rememberServerAddress('https://valence.test');
    keepTheSessionToken('a-session');
  });

  it('asks the server for the picture as whoever is signed in', async () => {
    const drawn = await render(<Artwork path="/api/media/1/image/poster" />);

    expect(
      drawn.getByRole('image', { name: 'https://valence.test/api/media/1/image/poster' }),
    ).toBeTruthy();
    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: {
          uri: 'https://valence.test/api/media/1/image/poster',
          headers: { authorization: 'Bearer a-session' },
        },
      }),
    );
  });

  it('never sends the session with a picture from somewhere else', async () => {
    await render(<Artwork path="https://image.tmdb.org/poster.jpg" />);

    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: { uri: 'https://image.tmdb.org/poster.jpg', headers: {} },
      }),
    );
  });

  it('shows only its surface where there is no picture', async () => {
    const drawn = await render(<Artwork path={null} />);

    expect(drawn.queryByRole('image')).toBeNull();
  });

  it('gives up on a picture that will not load and says so', async () => {
    const onMissing = jest.fn();
    const drawn = await render(<Artwork path="/api/media/1/image/logo" onMissing={onMissing} />);

    await fireEvent(drawn.getByRole('image'), 'error');

    expect(onMissing).toHaveBeenCalledTimes(1);
    expect(drawn.queryByRole('image')).toBeNull();
  });

  it('loads the picture filling the screen ahead of the rest', async () => {
    await render(<Artwork path="/api/media/1/image/backdrop" isUrgent />);

    expect(mockDrawnImage).toHaveBeenLastCalledWith(expect.objectContaining({ priority: 'high' }));
  });

  it('dissolves a changed picture in where it is told how long to take', async () => {
    await render(<Artwork path="/api/media/1/image/backdrop" crossfadeMs={600} />);

    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({ transition: { duration: 600, effect: 'cross-dissolve' } }),
    );
  });

  it('knows each picture by where it is served otherwise', async () => {
    await render(<Artwork path="/api/media/1/image/poster" />);

    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({ recyclingKey: '/api/media/1/image/poster' }),
    );
  });
});
