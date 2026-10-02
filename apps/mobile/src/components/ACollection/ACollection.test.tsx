import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchCollection } from '@ValenceClient/collections/fetchCollections';
import { aTitle } from '@ValenceMobile/testing/aTitle';
import { ACollection } from './ACollection';

jest.mock('@ValenceClient/collections/fetchCollections', () => ({
  ...jest.requireActual<object>('@ValenceClient/collections/fetchCollections'),
  fetchCollection: jest.fn(),
}));

const SAGA_ID = '00000000-0000-4000-8000-00000000c011';

const SAGA = {
  id: SAGA_ID,
  name: 'Saga',
  description: 'Every film of it.',
  isOrdered: true,
  hasOwnArtwork: false,
  entryCount: 2,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

const FILM = aTitle();

const PILOT = aTitle({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
  title: 'Pilot',
  seriesId: '3fa85f64-5717-4562-b3fc-2c963f66afa9',
  seriesTitle: 'The Show',
});

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchCollection).mockResolvedValue({
    collection: SAGA,
    entries: [
      { id: 'one', position: 1, addedAt: SAGA.updatedAt, kind: 'film', media: FILM },
      { id: 'two', position: 2, addedAt: SAGA.updatedAt, kind: 'series', media: PILOT },
    ],
  });
});

/**
 * Opens the collection.
 *
 * @returns What was drawn, and what it was told.
 */
const opened = async () => {
  const told = { onLookAt: jest.fn(), onLookAtShow: jest.fn(), onBack: jest.fn() };
  const drawn = await render(<ACollection collectionId={SAGA_ID} {...told} />, {
    wrapper: CacheScope,
  });

  return { drawn, told };
};

describe('ACollection', () => {
  it('shows what the collection is and how much is in it', async () => {
    const { drawn } = await opened();

    expect(await drawn.findByText('Saga')).toBeTruthy();
    expect(drawn.getByText('2 titles, in order')).toBeTruthy();
    expect(drawn.getByText('Every film of it.')).toBeTruthy();
  });

  it('opens a film as a film and a programme as a programme', async () => {
    const { drawn, told } = await opened();

    await userEvent.press(await drawn.findByRole('button', { name: 'Arrival' }));
    await userEvent.press(drawn.getByRole('button', { name: 'The Show' }));

    expect(told.onLookAt).toHaveBeenCalledWith(FILM.id);
    expect(told.onLookAtShow).toHaveBeenCalledWith(PILOT.libraryId, PILOT.seriesId);
  });

  it('says when there is nothing in it yet', async () => {
    jest.mocked(fetchCollection).mockResolvedValue({
      collection: { ...SAGA, entryCount: 0, description: null },
      entries: [],
    });

    const { drawn } = await opened();

    expect(await drawn.findByText('Nothing in this collection yet')).toBeTruthy();
  });
});
