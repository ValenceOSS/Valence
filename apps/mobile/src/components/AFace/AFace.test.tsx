import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { AFace } from './AFace';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const aProfile = (overrides: Partial<ViewerProfile> = {}): ViewerProfile => ({
  id: '176acd29-9b53-4193-831d-291bc7a9d4eb',
  name: 'Dan',
  colour: '#e8503a',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const PLACED = { position: 'absolute', left: -288, top: -48, width: 384, height: 192 } as const;

const thePicture = () => {
  const [picture] = theDrawnRoot().queryAll((node) => node.type === 'Image');

  if (picture === undefined) {
    throw new Error('No picture was drawn.');
  }

  return picture;
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

describe('AFace', () => {
  it('names whose face it is', async () => {
    const drawn = await render(<AFace profile={aProfile()} />);

    expect(drawn.getByText('Dan')).toBeTruthy();
  });

  it('draws at the size it is given, its letter scaled with it and no name beneath', async () => {
    const drawn = await render(<AFace profile={aProfile()} side={180} />);

    expect(drawn.getByText('D')).toHaveStyle({ fontSize: 72 });
    expect(drawn.queryByText('Dan')).toBeNull();
  });

  it('reads a drawn face clear and paints its colour behind it, so a colour shows at once', async () => {
    const fetched = jest.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => undefined));
    const drawn = await render(
      <AFace
        profile={aProfile({
          avatar: { kind: 'drawn', style: 'lorelei', seed: 'dan', isOnColour: true },
        })}
      />,
    );

    expect(fetched).toHaveBeenCalledWith(expect.stringContaining('/avatars/lorelei?seed=dan'));
    expect(fetched).not.toHaveBeenCalledWith(expect.stringContaining('colour='));
    expect(drawn.getByText('D').parent).toHaveStyle({ backgroundColor: '#e8503a' });

    fetched.mockRestore();
  });

  it('paints a letter face’s gradient behind its letter', async () => {
    const drawn = await render(
      <AFace
        profile={aProfile({
          colour: '#ff7a59',
          avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED, colourTo: '#e83a90' },
        })}
      />,
    );

    expect(drawn.getByText('D').parent).toHaveStyle({
      experimental_backgroundImage: 'linear-gradient(135deg, #ff7a59, #e83a90)',
    });
  });

  it('falls back to the initial where there is no picture', async () => {
    const drawn = await render(<AFace profile={aProfile()} />);

    expect(drawn.getByText('D')).toBeTruthy();
  });

  it('keeps the initial until the picture has been read, then draws the picture alone', async () => {
    const drawn = await render(
      <AFace
        profile={aProfile({
          avatar: { kind: 'photo', isVideo: false, frame: null, hasFramedPicture: false },
        })}
      />,
    );

    expect(drawn.getByText('D')).toBeTruthy();

    await fireEvent(thePicture(), 'load');

    expect(drawn.queryByText('D')).toBeNull();
  });

  it('frames a photograph the way its owner placed it', async () => {
    await render(
      <AFace
        profile={aProfile({
          id: 'framed',
          avatar: {
            kind: 'photo',
            isVideo: false,
            frame: { zoom: 2, x: 1, y: 0 },
            hasFramedPicture: false,
          },
        })}
      />,
    );

    await fireEvent(thePicture(), 'load', {
      nativeEvent: { source: { width: 2000, height: 1000 } },
    });

    expect(thePicture().parent).toHaveStyle(PLACED);
  });

  it('draws a photograph the server framed as it comes, without moving it again', async () => {
    await render(
      <AFace
        profile={aProfile({
          id: 'server-framed',
          avatar: {
            kind: 'photo',
            isVideo: false,
            frame: { zoom: 2, x: 1, y: 0 },
            hasFramedPicture: true,
          },
        })}
      />,
    );

    await fireEvent(thePicture(), 'load', {
      nativeEvent: { source: { width: 2000, height: 1000 } },
    });

    expect(thePicture().parent).not.toHaveStyle(PLACED);
  });

  it('moves a photograph being chosen as its frame is moved, before it is sent', async () => {
    await render(
      <AFace
        profile={aProfile({
          id: 'being-chosen',
          avatar: {
            kind: 'photo',
            isVideo: false,
            frame: { zoom: 2, x: 1, y: 0 },
            hasFramedPicture: false,
          },
        })}
        picked="file:///chosen.jpg"
      />,
    );

    await fireEvent(thePicture(), 'load', {
      nativeEvent: { source: { width: 2000, height: 1000 } },
    });

    expect(thePicture().parent).toHaveStyle(PLACED);
  });
});
