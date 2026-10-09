import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { aCatalogueTitleDetail } from '@ValenceClient/testing/aCatalogueTitleDetail';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DiscoverHero } from './DiscoverHero';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchAskable: (kind: MediaRequestKind, id: string) =>
    Promise.resolve(
      aCatalogueTitleDetail({
        kind,
        id,
        title: id === '1' ? 'A Film' : 'A Series',
        backdropUrl: id === '3' ? null : `/backdrops/${id}.jpg`,
        logoUrl: id === '1' ? '/logos/1.png' : null,
        genres: ['Drama', 'Mystery', 'Western'],
        year: 2026,
      }),
    ),
}));

const TITLES = [
  aCatalogueTitle({ kind: 'film', id: '1', title: 'A Film' }),
  aCatalogueTitle({ kind: 'series', id: '2', title: 'A Series' }),
  aCatalogueTitle({ kind: 'series', id: '3', title: 'Without A Backdrop' }),
];

describe('DiscoverHero', () => {
  it('shows each trending title with a backdrop, its logo where it has one, to request', async () => {
    const onAsk = vi.fn();
    const user = userEvent.setup();

    renderInAnAddress(<DiscoverHero titles={TITLES} onAsk={onAsk} rotateAfterMilliseconds={0} />);

    expect(await screen.findByRole('img', { name: 'A Film' })).toBeInTheDocument();
    expect(screen.getByText('Trending film this week')).toBeInTheDocument();
    expect(screen.getByText('Drama, Mystery')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Request' }));

    expect(onAsk).toHaveBeenCalledWith('film:1');
  });

  it('shows nothing until a title with a backdrop is described', () => {
    const { container } = renderInAnAddress(<DiscoverHero titles={[]} onAsk={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscoverHero.displayName).toBe('DiscoverHero');
  });
});
