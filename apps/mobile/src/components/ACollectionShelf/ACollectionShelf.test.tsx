import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ACollectionShelf } from './ACollectionShelf';

const SAGA = {
  id: '00000000-0000-4000-8000-00000000c011',
  name: 'Saga',
  description: null,
  isOrdered: true,
  hasOwnArtwork: false,
  entryCount: 3,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ACollectionShelf', () => {
  it('shows each collection, and opens the one pressed', async () => {
    const onLookAtCollection = jest.fn();
    const drawn = await render(
      <ACollectionShelf collections={[SAGA]} onLookAtCollection={onLookAtCollection} />,
    );

    expect(drawn.getByText('Collections')).toBeTruthy();
    expect(drawn.getByText('3 titles')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Saga' }));

    expect(onLookAtCollection).toHaveBeenCalledWith(SAGA.id);
  });
});
