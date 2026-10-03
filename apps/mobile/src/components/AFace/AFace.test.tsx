import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { AFace } from './AFace';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

const aProfile = (overrides: Partial<ViewerProfile> = {}): ViewerProfile => ({
  id: '176acd29-9b53-4193-831d-291bc7a9d4eb',
  name: 'Dan',
  colour: '#e8503a',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  prefersBestCopy: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

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

  it('falls back to the initial where there is no picture', async () => {
    const drawn = await render(<AFace profile={aProfile()} />);

    expect(drawn.getByText('D')).toBeTruthy();
  });

  it('keeps the initial until the picture has been read, then draws the picture alone', async () => {
    const drawn = await render(
      <AFace profile={aProfile({ avatar: { kind: 'photo', isVideo: false, frame: null } })} />,
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
          avatar: { kind: 'photo', isVideo: false, frame: { zoom: 2, x: 1, y: 0 } },
        })}
      />,
    );

    expect(thePicture().parent).toHaveStyle({
      transform: [{ scale: 2 }, { translateX: -24 }, { translateY: -0 }],
    });
  });
});
