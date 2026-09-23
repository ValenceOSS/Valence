import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { Face } from '@ValenceTv/components/Face/Face';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

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

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

describe('Face', () => {
  beforeEach(() => {
    mockDrawnImage.mockClear();
    rememberServerAddress('https://valence.test');
    keepTheSessionToken('a-session');
  });

  it('draws their initial on their colour where they have no picture', async () => {
    const drawn = await render(<Face profile={PROFILE} size={100} />);

    expect(drawn.getByText('M')).toBeTruthy();
    expect(drawn.toJSON()).toHaveStyle({ backgroundColor: '#3a8ee8', width: 100, height: 100 });
    expect(drawn.queryByRole('image')).toBeNull();
  });

  it('draws their photograph, asked for as whoever is signed in', async () => {
    const drawn = await render(
      <Face profile={{ ...PROFILE, avatar: { kind: 'photo', isVideo: false } }} size={100} />,
    );

    expect(drawn.getByRole('image')).toBeTruthy();
    expect(drawn.queryByText('M')).toBeNull();
    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: {
          uri: `https://valence.test/api/profiles/${PROFILE.id}/avatar?v=2026-09-02T00%3A00%3A00.000Z`,
          headers: { authorization: 'Bearer a-session' },
        },
      }),
    );
  });

  it('falls back to their initial where their picture will not load', async () => {
    const drawn = await render(
      <Face
        profile={{ ...PROFILE, avatar: { kind: 'drawn', style: 'lorelei', seed: 'marques' } }}
        size={100}
      />,
    );

    await fireEvent(drawn.getByRole('image'), 'error');

    expect(drawn.getByText('M')).toBeTruthy();
    expect(drawn.queryByRole('image')).toBeNull();
  });

  it('is rounded into a circle where it is drawn round', async () => {
    const drawn = await render(<Face profile={PROFILE} size={80} isRound />);

    expect(drawn.toJSON()).toHaveStyle({ borderRadius: 40 });
  });

  it('is square with small corners otherwise', async () => {
    const drawn = await render(<Face profile={PROFILE} size={80} />);

    expect(drawn.toJSON()).toHaveStyle({ borderRadius: tokens.radii.md });
  });

  it('is ringed in white while the remote is on it', async () => {
    const drawn = await render(<Face profile={PROFILE} size={80} isFocused />);

    expect(drawn.toJSON()).toHaveStyle({ borderWidth: 6, borderColor: tokens.colours.text });
  });
});
