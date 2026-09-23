import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchLibraries } from '@ValenceClient/library/fetchLibrary';
import { TheHidden } from './TheHidden';

jest.mock('@ValenceClient/library/fetchLibrary', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchLibrary'),
  fetchLibraries: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheHidden', () => {
  it('offers each library to hide, and says nothing is hidden yet', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        name: 'Films',
        kind: 'movies',
        path: '/media/films',
        itemCount: 1,
        lastScannedAt: null,
        defaultAudioLanguage: null,
        filesAtOnce: null,
        takesRequests: true,
        requestProfileId: null,
        requestPath: null,
      },
    ]);
    const drawn = await render(<TheHidden />, { wrapper: CacheScope });

    expect(await drawn.findByText('Films')).toBeTruthy();
    expect(drawn.getByText('Nothing hidden.')).toBeTruthy();
  });
});
