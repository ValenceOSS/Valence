import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CatalogueGrid } from './CatalogueGrid';
import type { CataloguePage } from '@ValenceContracts/schemas/CatalogueTitle';
import type * as Askable from '@ValenceClient/requests/fetchAskable';

const fetchCatalogueBrowse = vi.fn<typeof Askable.fetchCatalogueBrowse>();

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchCatalogueBrowse: (...given: Parameters<typeof Askable.fetchCatalogueBrowse>) =>
    fetchCatalogueBrowse(...given),
}));

const ASKABLE = { status: 'askable', mediaId: null, requestId: null, requestState: null } as const;

/**
 * A page of titles, named after what is on it.
 */
const aPage = (title: string, page: number, hasMore: boolean): CataloguePage => ({
  titles: [
    {
      kind: 'film',
      id: title,
      title,
      subtitle: null,
      year: 2021,
      overview: null,
      posterUrl: null,
      standing: ASKABLE,
    },
  ],
  page,
  hasMore,
});

const BROWSING = { kind: 'film', list: 'popular', studio: null } as const;

beforeEach(() => {
  fetchCatalogueBrowse.mockReset().mockResolvedValue(aPage('Dune', 1, true));
});

describe('CatalogueGrid', () => {
  it('lays out what the catalogue listed, and opens what is chosen', async () => {
    const onAsk = vi.fn();

    renderInAnAddress(<CatalogueGrid browsing={BROWSING} onAsk={onAsk} />);

    await userEvent.click(await screen.findByRole('button', { name: /Dune/ }));

    expect(onAsk).toHaveBeenCalledWith('film:Dune');
    expect(fetchCatalogueBrowse).toHaveBeenCalledWith(BROWSING, 1);
  });

  it('says there is nothing where the catalogue listed nothing', async () => {
    fetchCatalogueBrowse.mockResolvedValue({ titles: [], page: 1, hasMore: false });

    renderInAnAddress(<CatalogueGrid browsing={BROWSING} onAsk={vi.fn()} />);

    expect(await screen.findByText('Nothing to ask for here')).toBeInTheDocument();
  });

  it('says so where the catalogue could not be read', async () => {
    fetchCatalogueBrowse.mockRejectedValue(new Error('The catalogue is not answering.'));

    renderInAnAddress(<CatalogueGrid browsing={BROWSING} onAsk={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('reads the next page when the foot of the one showing comes near', async () => {
    const observers: (() => void)[] = [];

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(told: (entries: { isIntersecting: boolean }[]) => void) {
          observers.push(() => {
            told([{ isIntersecting: true }]);
          });
        }

        observe() {
          return undefined;
        }

        disconnect() {
          return undefined;
        }
      },
    );

    renderInAnAddress(<CatalogueGrid browsing={BROWSING} onAsk={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Dune/ })).toBeInTheDocument();

    fetchCatalogueBrowse.mockResolvedValue(aPage('Arrival', 2, false));
    observers.at(-1)?.();

    expect(await screen.findByRole('button', { name: /Arrival/ })).toBeInTheDocument();
    expect(fetchCatalogueBrowse).toHaveBeenLastCalledWith(BROWSING, 2);

    vi.unstubAllGlobals();
  });
});
