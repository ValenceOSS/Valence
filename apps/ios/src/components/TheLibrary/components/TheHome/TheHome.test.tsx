import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TheHome } from './TheHome';

const aHome = (librariesAre: 'reading' | 'missing' | 'there') => (
  <TheHome
    header={null}
    watchable={[]}
    librariesAre={librariesAre}
    onWatch={jest.fn()}
    onLookAt={jest.fn()}
    onLookAtShow={jest.fn()}
    onShowing={jest.fn()}
    onClip={jest.fn()}
  />
);

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheHome', () => {
  it('says there are no libraries yet on a server that has none', async () => {
    const drawn = await render(aHome('missing'), { wrapper: CacheScope });

    expect(await drawn.findByText('No libraries yet')).toBeTruthy();
  });

  it('calls nothing empty while the libraries are still being read', async () => {
    const drawn = await render(aHome('reading'), { wrapper: CacheScope });

    expect(drawn.queryByText('No libraries yet')).toBeNull();
  });
});
