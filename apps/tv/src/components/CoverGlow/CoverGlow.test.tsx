import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { render } from '@testing-library/react-native';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { CoverGlow } from '@ValenceTv/components/CoverGlow/CoverGlow';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';

type MockImageProps = {
  source: { uri: string; headers: Record<string, string> };
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
    });
  },
}));

describe('CoverGlow', () => {
  beforeEach(() => {
    mockDrawnImage.mockClear();
    rememberServerAddress('https://valence.test');
    keepTheSessionToken('a-session');
  });

  it('washes the screen in the blurred cover of what is playing', async () => {
    const drawn = await render(<CoverGlow path="/api/music/albums/1/artwork" />);

    expect(
      drawn.getByRole('image', { name: 'https://valence.test/api/music/albums/1/artwork' }),
    ).toBeTruthy();
    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: {
          uri: 'https://valence.test/api/music/albums/1/artwork',
          headers: { authorization: 'Bearer a-session' },
        },
        blurRadius: 70,
        transition: { duration: 900, effect: 'cross-dissolve' },
      }),
    );
  });

  it('is a plain dark screen where there is no cover', async () => {
    const drawn = await render(<CoverGlow path={null} />);

    expect(drawn.queryByRole('image')).toBeNull();
    expect(drawn.toJSON()).not.toBeNull();
  });
});
