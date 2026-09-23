import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchLibraries } from '@ValenceClient/library/fetchLibrary';
import { TheSearch } from './TheSearch';

jest.mock('@ValenceClient/library/fetchLibrary', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchLibrary'),
  fetchLibraries: jest.fn(),
}));

const aSearch = () => (
  <TheSearch
    onLookAt={jest.fn()}
    onLookAtShow={jest.fn()}
    onAsk={null}
    onAlbum={jest.fn()}
    onArtist={jest.fn()}
    onPlaylist={jest.fn()}
    onBook={jest.fn()}
  />
);

describe('TheSearch', () => {
  it('looks through every library, offering books where there is a library of them', async () => {
    installPlatform(aFakePlatform());
    jest.mocked(fetchLibraries).mockResolvedValue([
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afb1',
        name: 'Books',
        kind: 'books',
        path: '/media/books',
        itemCount: 1,
        lastScannedAt: null,
        defaultAudioLanguage: null,
        filesAtOnce: null,
        takesRequests: false,
        requestProfileId: null,
        requestPath: null,
      },
    ]);
    const drawn = await render(aSearch(), { wrapper: CacheScope });

    expect(await drawn.findByPlaceholderText('Films, programmes, people, books')).toBeTruthy();

    await userEvent.type(drawn.getByLabelText('Search'), 'dune');

    expect(await drawn.findByText('Books')).toBeTruthy();
  });
});
