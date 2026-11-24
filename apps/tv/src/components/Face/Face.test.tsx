import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DRAWINGS } from '@ValenceClient/profiles/DRAWINGS';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { Face } from '@ValenceTv/components/Face/Face';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

type MockImageProps = {
  source: { uri: string; headers: Record<string, string> };
  onLoad?: () => void;
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
      onLoad: props.onLoad,
      onError: props.onError,
    });
  },
}));

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  language: null,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

describe('Face', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    DRAWINGS.clear();
  });

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

  it('writes the initial in whichever ink reads on the colour', async () => {
    const light = await render(<Face profile={{ ...PROFILE, colour: '#111418' }} size={100} />);

    expect(light.getByText('M')).toHaveStyle({ color: '#f7f7f5' });

    const dark = await render(<Face profile={{ ...PROFILE, colour: '#f2c94c' }} size={100} />);

    expect(dark.getByText('M')).toHaveStyle({ color: '#15171a' });
  });

  it('draws their photograph, asked for as whoever is signed in', async () => {
    const drawn = await render(
      <Face
        profile={{
          ...PROFILE,
          avatar: { kind: 'photo', isVideo: false, frame: null, hasFramedPicture: false },
        }}
        size={100}
      />,
    );

    expect(drawn.getByText('M')).toBeTruthy();

    await fireEvent(drawn.getByRole('image'), 'load');

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

  it('asks for the square the server framed, where it frames them', async () => {
    await render(
      <Face
        profile={{
          ...PROFILE,
          avatar: { kind: 'photo', isVideo: false, frame: null, hasFramedPicture: true },
        }}
        size={100}
      />,
    );

    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: {
          uri: `https://valence.test/api/profiles/${PROFILE.id}/avatar?v=2026-09-02T00%3A00%3A00.000Z&framed=1`,
          headers: { authorization: 'Bearer a-session' },
        },
      }),
    );
  });

  it('draws a drawn face as a vector read from the drawing, which needs nobody signed in', async () => {
    const asked = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect /></svg>'),
      );
    const drawn = await render(
      <Face
        profile={{ ...PROFILE, avatar: { kind: 'drawn', style: 'lorelei', seed: 'marques' } }}
        size={100}
      />,
    );

    await waitFor(() => {
      expect(drawn.queryByText('M')).toBeNull();
    });
    expect(asked).toHaveBeenCalledWith(
      'https://valence.test/api/profiles/avatars/lorelei?seed=marques',
    );
    expect(mockDrawnImage).not.toHaveBeenCalled();
  });

  it('keeps the initial where a drawing cannot be had', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('gone', { status: 404 }));
    const drawn = await render(
      <Face
        profile={{ ...PROFILE, avatar: { kind: 'drawn', style: 'lorelei', seed: 'gone' } }}
        size={100}
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(drawn.getByText('M')).toBeTruthy();
  });

  it('falls back to their initial where their picture will not load', async () => {
    const drawn = await render(
      <Face
        profile={{
          ...PROFILE,
          avatar: { kind: 'photo', isVideo: false, frame: null, hasFramedPicture: false },
        }}
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

  it('sets a display name so devtools can identify it', () => {
    expect(Face.displayName).toBe('Face');
  });

  it('is ringed in white while the remote is on it', async () => {
    const drawn = await render(<Face profile={PROFILE} size={80} isFocused />);

    expect(drawn.toJSON()).toHaveStyle({ borderWidth: 6, borderColor: tokens.colours.text });
  });
});
