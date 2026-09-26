import { render } from '@testing-library/react-native';
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
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

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

  it('draws no initial where there is a picture to draw instead', async () => {
    const drawn = await render(
      <AFace profile={aProfile({ avatar: { kind: 'photo', isVideo: false, frame: null } })} />,
    );

    expect(drawn.queryByText('D')).toBeNull();
  });
});
