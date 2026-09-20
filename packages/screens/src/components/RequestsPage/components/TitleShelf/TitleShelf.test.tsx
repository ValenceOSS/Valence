import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TitleShelf } from './TitleShelf';
import type { CatalogueShelf } from '@ValenceContracts/schemas/CatalogueTitle';

const ASKABLE = { status: 'askable', mediaId: null, requestId: null, requestState: null } as const;

const SHELF: CatalogueShelf = {
  id: 'trending-films',
  title: 'Trending films',
  titles: [
    {
      kind: 'film',
      id: '438631',
      title: 'Dune',
      subtitle: null,
      year: 2021,
      overview: null,
      posterUrl: null,
      standing: ASKABLE,
    },
    {
      kind: 'film',
      id: '1',
      title: 'Kept',
      subtitle: null,
      year: 2019,
      overview: null,
      posterUrl: null,
      standing: { status: 'library', mediaId: 'media-1', requestId: null, requestState: null },
    },
  ],
  browse: { kind: 'film', list: 'trending', studio: null },
};

describe('TitleShelf', () => {
  it('marks what is in the library already with an icon, and opens what is chosen', async () => {
    const onAsk = vi.fn();

    render(<TitleShelf shelf={SHELF} onAsk={onAsk} onBrowse={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'In your library' })).toBeInTheDocument();
    expect(screen.queryByText('In your library')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Dune/ }));

    expect(onAsk).toHaveBeenCalledWith('film:438631');
  });

  it('leads nowhere further where the shelf was not taken from a list', () => {
    render(<TitleShelf shelf={{ ...SHELF, browse: null }} onAsk={vi.fn()} onBrowse={vi.fn()} />);

    expect(screen.queryByText('See more')).not.toBeInTheDocument();
  });
});
