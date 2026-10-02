import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PartOfCollections } from './PartOfCollections';

const collections = vi.hoisted(() => ({
  fetchCollections: vi.fn(),
  fetchCollection: vi.fn(),
}));

vi.mock('@ValenceClient/collections/fetchCollections', () => collections);

const SAGA = {
  id: '00000000-0000-4000-8000-00000000c011',
  name: 'Saga',
  description: null,
  isOrdered: true,
  hasOwnArtwork: false,
  entryCount: 2,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

beforeEach(() => {
  collections.fetchCollections.mockReset();
  collections.fetchCollections.mockResolvedValue([SAGA]);
});

describe('PartOfCollections', () => {
  it('names the collections a title is part of, and opens one', async () => {
    renderInAnAddress(<PartOfCollections subject={{ seriesId: 'show' }} />);

    expect(await screen.findByText('Part of')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Saga' }));

    expect(collections.fetchCollections).toHaveBeenCalledWith({
      containing: { seriesId: 'show' },
    });
    await waitFor(() => {
      expect(window.location.search).toContain(`collection=${SAGA.id}`);
    });
  });

  it('says nothing for a title in no collection', async () => {
    collections.fetchCollections.mockResolvedValue([]);

    const { container } = renderInAnAddress(
      <PartOfCollections subject={{ mediaItemId: 'film' }} />,
    );

    await waitFor(() => {
      expect(collections.fetchCollections).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('asks nothing while there is no title', () => {
    renderInAnAddress(<PartOfCollections subject={null} />);

    expect(collections.fetchCollections).not.toHaveBeenCalled();
  });
});
