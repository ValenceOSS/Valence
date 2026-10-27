import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchCollections } from '@ValenceClient/collections/fetchCollections';
import { CollectionSchema } from '@ValenceContracts/schemas/Collection';
import { AnAddToCollectionSheet } from './AnAddToCollectionSheet';

jest.mock('@ValenceClient/collections/fetchCollections', () => ({
  ...jest.requireActual<object>('@ValenceClient/collections/fetchCollections'),
  fetchCollections: jest.fn(),
}));

/**
 * A collection with only what the sheet shows.
 *
 * @param id - Which one.
 * @param name - What it is called.
 * @param isSmart - Whether it fills itself from rules.
 * @returns The collection.
 */
const aCollection = (id: string, name: string, isSmart: boolean) =>
  CollectionSchema.parse({
    id,
    name,
    description: null,
    isOrdered: false,
    hasOwnArtwork: false,
    entryCount: 1,
    coverMediaIds: [],
    isSmart,
    updatedAt: '2026-10-02T00:00:00.000Z',
  });

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest
    .mocked(fetchCollections)
    .mockImplementation((listing) =>
      Promise.resolve(
        listing?.containing === undefined
          ? [
              aCollection('00000000-0000-4000-8000-00000000c011', 'Saga', false),
              aCollection('00000000-0000-4000-8000-00000000c012', 'Unwatched', true),
            ]
          : [],
      ),
    );
});

describe('AnAddToCollectionSheet', () => {
  it('offers the collections filled by hand, and none that fill themselves', async () => {
    const drawn = await render(
      <AnAddToCollectionSheet subject={{ mediaItemId: 'film' }} title="Hope" onClose={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Saga')).toBeTruthy();
    expect(drawn.queryByText('Unwatched')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnAddToCollectionSheet.displayName).toBe('AnAddToCollectionSheet');
  });
});
