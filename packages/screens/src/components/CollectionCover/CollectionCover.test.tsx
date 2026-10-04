import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CollectionCover } from './CollectionCover';

const SAGA = {
  id: 'saga',
  name: 'Saga',
  hasOwnArtwork: false,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

/**
 * The addresses of the pictures a cover drew.
 *
 * @returns The addresses, in order.
 */
const drawn = (): (string | null)[] =>
  [...screen.getByRole('img', { name: 'Saga' }).querySelectorAll('img')].map((one) =>
    one.getAttribute('src'),
  );

describe('CollectionCover', () => {
  it('names the collection for anybody not looking at it', () => {
    render(<CollectionCover collection={SAGA} />);

    expect(screen.getByRole('img', { name: 'Saga' })).toBeInTheDocument();
    expect(drawn()).toEqual([]);
  });

  it('draws the first poster alone until there are four', () => {
    render(<CollectionCover collection={{ ...SAGA, coverMediaIds: ['a', 'b', 'c'] }} />);

    expect(drawn()).toEqual(['/api/media/a/image/poster?size=small']);
  });

  it('draws four posters once there are four', () => {
    render(<CollectionCover collection={{ ...SAGA, coverMediaIds: ['a', 'b', 'c', 'd'] }} />);

    expect(drawn()).toHaveLength(4);
  });

  it('draws the artwork it was given instead of any poster', () => {
    render(<CollectionCover collection={{ ...SAGA, hasOwnArtwork: true, coverMediaIds: ['a'] }} />);

    expect(drawn()).toEqual([
      `/api/collections/saga/artwork?v=${encodeURIComponent(SAGA.updatedAt)}`,
    ]);
  });
});
