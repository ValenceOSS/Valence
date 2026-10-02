import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollectionTile } from './CollectionTile';

const SAGA = {
  id: 'saga',
  name: 'Saga',
  description: null,
  isOrdered: true,
  hasOwnArtwork: false,
  entryCount: 3,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

describe('CollectionTile', () => {
  it('says what the collection is called and how much is in it', () => {
    render(<CollectionTile collection={SAGA} onOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Saga/ })).toHaveTextContent('3 titles');
  });

  it('opens the collection when pressed', async () => {
    const onOpen = vi.fn();

    render(<CollectionTile collection={SAGA} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: /Saga/ }));

    expect(onOpen).toHaveBeenCalled();
  });
});
