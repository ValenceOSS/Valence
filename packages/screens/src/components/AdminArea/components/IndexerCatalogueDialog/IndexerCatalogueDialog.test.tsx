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
      id: '1337x',
      name: '1337x',
      description: 'A public torrent site',
      language: 'en-US',
      privacy: 'public',
      protocol: 'torrent',
      categories: ['Movies', 'TV'],
    },
    {
      id: 'rutor',
      name: 'RuTor',
      description: 'A Russian tracker',
      language: 'ru-RU',
      privacy: 'public',
      protocol: 'torrent',
      categories: ['TV'],
    },
    {
      id: 'hdb',
      name: 'HDBits',
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
  it('lists every site, with how many there are and where they came from', async () => {
    open();

    expect(await screen.findByText('RuTor')).toBeInTheDocument();
    expect(screen.getByText('HDBits')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('3 sites, brought up to date');
    expect(screen.getByRole('status')).toHaveTextContent(
      'from Prowlarr/Indexers@master/definitions/v11',
    );
  });

  it('finds a site by name, and narrows by privacy, category and language', async () => {
    const user = userEvent.setup();

    open();

    await screen.findByText('RuTor');
    await user.type(screen.getByRole('searchbox', { name: /Find a site/ }), 'hd');

    expect(screen.queryByText('RuTor')).not.toBeInTheDocument();
    expect(screen.getByText('HDBits')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: /Find a site/ }));
    await user.click(screen.getByRole('button', { name: 'Public' }));

    expect(screen.queryByText('HDBits')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filter by language' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'ru-RU' }));

    expect(screen.queryByText('1337x')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filter by category' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Movies' }));

    expect(
      await screen.findByText('No site matches. Try fewer words, or another category.'),
    ).toBeInTheDocument();
  });

  it('chooses a site from the catalogue', async () => {
    const user = userEvent.setup();
    const { onChoose } = open();

    await user.click(await screen.findByText('RuTor'));

    expect(onChoose).toHaveBeenCalledWith({
      kind: 'cardigann',
      definitionId: 'rutor',
      name: 'RuTor',
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

    await screen.findByText('RuTor');
    await user.click(screen.getByRole('button', { name: /Bring up to date/ }));

    expect(await screen.findByText('Newcomer')).toBeInTheDocument();
  });

  it('says so when it could not be brought up to date, or last failed to be', async () => {
    refreshCatalogue.mockRejectedValue(new Error('offline'));
    fetchCatalogue.mockResolvedValue({
      ...CATALOGUE,
      updatedAt: null,
      problem: 'The definitions could not be fetched',
    });

    const user = userEvent.setup();

    open();

    expect(await screen.findByText('The definitions could not be fetched')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Bring up to date/ }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'The catalogue could not be brought up to date.',
      );
    });
  });

  it('says an empty catalogue is empty, and how to fill it', async () => {
    fetchCatalogue.mockResolvedValue({ ...CATALOGUE, definitions: [], updatedAt: null });

    open();

    expect(await screen.findByText(/The catalogue is empty/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 sites from');
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
});
