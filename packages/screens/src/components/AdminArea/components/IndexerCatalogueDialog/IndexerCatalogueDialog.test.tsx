import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { IndexerCatalogueDialog } from './IndexerCatalogueDialog';
import type { IndexerCatalogue } from '@ValenceContracts/schemas/IndexerDefinition';
import type * as Definitions from '@ValenceClient/requests/fetchDefinitions';

const fetchCatalogue = vi.fn<typeof Definitions.fetchCatalogue>();
const refreshCatalogue = vi.fn<typeof Definitions.refreshCatalogue>();

vi.mock('@ValenceClient/requests/fetchDefinitions', () => ({
  fetchCatalogue: () => fetchCatalogue(),
  refreshCatalogue: () => refreshCatalogue(),
  fetchDefinition: vi.fn(),
}));

const CATALOGUE: IndexerCatalogue = {
  definitions: [
    {
      id: 'GeneralTracker',
      name: 'GeneralTracker',
      description: 'A public torrent site',
      language: 'en-US',
      privacy: 'public',
      protocol: 'torrent',
      categories: ['Movies', 'TV'],
    },
    {
      id: 'russiantracker',
      name: 'RussianTracker',
      description: 'A Russian tracker',
      language: 'ru-RU',
      privacy: 'public',
      protocol: 'torrent',
      categories: ['TV'],
    },
    {
      id: 'hdb',
      name: 'PrivateHD',
      description: 'For HD',
      language: 'en-US',
      privacy: 'private',
      protocol: 'torrent',
      categories: ['Movies'],
    },
  ],
  updatedAt: '2026-09-19T00:00:00.000Z',
  source: 'Prowlarr/Indexers@master/definitions/v11',
  problem: null,
};

/**
 * Opens the catalogue.
 */
const open = () => {
  const handlers = { onClose: vi.fn(), onChoose: vi.fn() };

  renderInAnAddress(<IndexerCatalogueDialog isOpen {...handlers} />);

  return handlers;
};

beforeEach(() => {
  fetchCatalogue.mockReset().mockResolvedValue(CATALOGUE);
  refreshCatalogue.mockReset().mockResolvedValue({
    ...CATALOGUE,
    definitions: [
      ...CATALOGUE.definitions,
      { ...CATALOGUE.definitions[0]!, id: 'new', name: 'Newcomer' },
    ],
  });
});

describe('IndexerCatalogueDialog', () => {
  it('lists every site, and keeps its footer for what has gone wrong', async () => {
    open();

    expect(await screen.findByText('RussianTracker')).toBeInTheDocument();
    expect(screen.getByText('PrivateHD')).toBeInTheDocument();
    expect(screen.queryByText(/3 sites/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('finds a site by name, and narrows by privacy, category and language', async () => {
    const user = userEvent.setup();

    open();

    await screen.findByText('RussianTracker');
    await user.type(screen.getByRole('searchbox', { name: /Search indexers/ }), 'hd');

    expect(screen.queryByText('RussianTracker')).not.toBeInTheDocument();
    expect(screen.getByText('PrivateHD')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: /Search indexers/ }));
    await user.click(screen.getByRole('button', { name: 'Public' }));

    expect(screen.queryByText('PrivateHD')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filter by language' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'ru-RU' }));

    expect(screen.queryByText('GeneralTracker')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filter by category' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Movies' }));

    expect(
      await screen.findByText('No indexers match. Try fewer words or another category.'),
    ).toBeInTheDocument();
  });

  it('chooses a site from the catalogue', async () => {
    const user = userEvent.setup();
    const { onChoose } = open();

    await user.click(await screen.findByText('RussianTracker'));

    expect(onChoose).toHaveBeenCalledWith({
      kind: 'cardigann',
      definitionId: 'russiantracker',
      name: 'RussianTracker',
    });
  });

  it('chooses a generic Torznab or Newznab indexer', async () => {
    const user = userEvent.setup();
    const { onChoose } = open();

    await user.click(screen.getByRole('button', { name: /Generic Newznab/ }));

    expect(onChoose).toHaveBeenCalledWith({ kind: 'newznab' });
  });

  it('brings the catalogue up to date', async () => {
    const user = userEvent.setup();

    open();

    await screen.findByText('RussianTracker');
    await user.click(screen.getByRole('button', { name: /Update catalogue/ }));

    expect(await screen.findByText('Newcomer')).toBeInTheDocument();
  });

  it('says so when it could not be brought up to date, or last failed to be', async () => {
    refreshCatalogue.mockRejectedValue(new Error('offline'));
    fetchCatalogue.mockResolvedValue({
      ...CATALOGUE,
      updatedAt: null,
      problem: sayVerbatim('The definitions could not be fetched'),
    });

    const user = userEvent.setup();

    open();

    expect(await screen.findByText('The definitions could not be fetched')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Update catalogue/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Couldn’t update the catalogue. Try again.',
      );
    });
  });

  it('says an empty catalogue is empty, and how to fill it', async () => {
    fetchCatalogue.mockResolvedValue({ ...CATALOGUE, definitions: [], updatedAt: null });

    open();

    expect(await screen.findByText(/No indexers are listed yet/)).toBeInTheDocument();
  });

  it('says it could not read the catalogue, and offers to try again', async () => {
    fetchCatalogue.mockRejectedValue(new Error('offline'));

    open();

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('closes', async () => {
    const user = userEvent.setup();
    const { onClose } = open();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(IndexerCatalogueDialog.displayName).toBe('IndexerCatalogueDialog');
  });

  it('sets the table of sites in a card, so it does not float in the dialog', async () => {
    open();

    const table = await screen.findByRole('table', { name: 'Sites' });

    expect(table.closest('.valence-surface')).not.toBeNull();
  });
});
