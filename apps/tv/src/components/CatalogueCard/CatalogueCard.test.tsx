import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { CatalogueCard } from '@ValenceTv/components/CatalogueCard/CatalogueCard';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const DUNE: CatalogueTitle = {
  kind: 'film',
  id: '438631',
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: null,
  posterUrl: 'https://image.tmdb.org/dune.jpg',
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
};

const REQUESTED: CatalogueTitle = {
  ...DUNE,
  standing: {
    status: 'requested',
    mediaId: null,
    requestId: '00000000-0000-4000-8000-000000000001',
    requestState: 'awaitingApproval',
  },
};

const HAD: CatalogueTitle = {
  ...DUNE,
  standing: { status: 'library', mediaId: 'media-1', requestId: null, requestState: null },
};

describe('CatalogueCard', () => {
  it('opens the title it shows', async () => {
    const onPress = jest.fn();
    const drawn = await render(<CatalogueCard title={DUNE} onPress={onPress} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onPress).toHaveBeenCalledWith(DUNE);
  });

  it('says where a title that has been asked for stands', async () => {
    const drawn = await render(<CatalogueCard title={REQUESTED} onPress={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Dune, Waiting for approval' })).toBeTruthy();
    expect(drawn.getByText('Waiting for approval')).toBeTruthy();
  });

  it('writes nothing under one the library already has', async () => {
    const drawn = await render(<CatalogueCard title={HAD} onPress={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Dune, In your library' })).toBeTruthy();
    expect(drawn.queryByText('In your library')).toBeNull();
  });

  it('names the title beneath its poster only while the remote is on it', async () => {
    const drawn = await render(<CatalogueCard title={DUNE} onPress={jest.fn()} />);

    expect(drawn.getByText('Dune')).toHaveStyle({ opacity: 0 });

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'focus');

    expect(drawn.getByText('Dune')).not.toHaveStyle({ opacity: 0 });
  });
});
