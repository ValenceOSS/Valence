import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AskableMusicShelf } from './AskableMusicShelf';
import type { CatalogueShelf } from '@ValenceContracts/schemas/CatalogueTitle';

const SHELF: CatalogueShelf = {
  id: 'popular-albums',
  title: 'Popular albums',
  titles: [
    {
      kind: 'album',
      id: 'deezer-7',
      title: 'Pylon',
      subtitle: 'Band',
      year: null,
      overview: null,
      posterUrl: null,
      standing: { status: 'requested', mediaId: null, requestId: null, requestState: 'searching' },
    },
  ],
  browse: null,
};

describe('AskableMusicShelf', () => {
  it('says who an album is by and where it stands, and opens what is chosen', async () => {
    const onAsk = vi.fn();

    render(<AskableMusicShelf shelf={SHELF} onAsk={onAsk} />);

    expect(screen.getByText('Band · Requested')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Pylon/ }));

    expect(onAsk).toHaveBeenCalledWith('album:deezer-7');
  });
});
