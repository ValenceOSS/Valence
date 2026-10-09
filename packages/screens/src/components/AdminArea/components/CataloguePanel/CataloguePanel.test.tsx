import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CataloguePanel } from './CataloguePanel';
import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const catalogue = vi.hoisted((): { entries: CatalogueEntry[] } => ({ entries: [] }));
const requested = vi.hoisted((): { requests: MediaRequest[] } => ({ requests: [] }));
const held = vi.hoisted((): { kinds: string[] } => ({ kinds: ['movies', 'shows'] }));
const decideMediaRequests = vi.fn<typeof Requests.decideMediaRequests>();
const searchMissing = vi.fn<typeof Requests.searchMissing>();

vi.mock('@ValenceClient/requests/fetchTitleCatalogue', () => ({
  fetchTitleCatalogue: () => Promise.resolve(catalogue.entries),
  fetchTitleFiles: () => Promise.resolve({ folder: null, files: [] }),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () =>
    Promise.resolve(held.kinds.map((kind, at) => ({ id: at.toString(), kind }))),
}));

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequests: () => Promise.resolve(requested.requests),
  decideMediaRequests: (...given: Parameters<typeof Requests.decideMediaRequests>) =>
    decideMediaRequests(...given),
  searchMissing: () => searchMissing(),
}));

const ASKED = aMediaRequest({ id: '6ba7b810-9dad-11d1-80b4-00c04fd43001', approval: 'awaiting' });

beforeEach(() => {
  held.kinds = ['movies', 'shows'];
  requested.requests = [ASKED];
  catalogue.entries = [
    aCatalogueEntry({ key: 'film:1', title: 'Held Film', addedAt: '2026-01-01T00:00:00.000Z' }),
    aCatalogueEntry({
      key: 'film:2',
      title: 'Asked Film',
      status: 'toApprove',
      requestId: ASKED.id,
      addedAt: '2026-02-01T00:00:00.000Z',
    }),
    aCatalogueEntry({ key: 'series:3', tab: 'shows', kind: 'series', title: 'A Show' }),
  ];
  decideMediaRequests.mockReset().mockResolvedValue({
    value: { decided: [ASKED], refused: [] },
    refusal: null,
  });
  searchMissing.mockReset().mockResolvedValue({
    value: { searched: 2, startedAt: '2026-01-01T00:00:00.000Z' },
    refusal: null,
  });
});

/**
 * The Catalogue on its Films tab, with nothing open.
 */
const aPanel = (overrides: Partial<Parameters<typeof CataloguePanel>[0]> = {}) => {
  const props = {
    tab: 'films' as const,
    title: null,
    onTab: vi.fn(),
    onOpen: vi.fn(),
    ...overrides,
  };

  renderInAnAddress(<CataloguePanel {...props} />);

  return props;
};

describe('CataloguePanel', () => {
  it('shows a tab’s titles with the statuses they stand at, and opens one', async () => {
    const { onOpen } = aPanel();

    expect(await screen.findByRole('button', { name: /Held Film/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /A Show/ })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Everything\s*2/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /To approve\s*1/ })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Held Film/ }));

    expect(onOpen).toHaveBeenCalledWith('film:1');
  });

  it('narrows to a status from its tile', async () => {
    const user = userEvent.setup();

    aPanel();

    await user.click(await screen.findByRole('radio', { name: /To approve/ }));

    expect(screen.queryByRole('button', { name: /Held Film/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Asked Film/ })).toBeInTheDocument();
  });

  it('switches to another kind of library', async () => {
    const { onTab } = aPanel();

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Shows' }));

    expect(onTab).toHaveBeenCalledWith('shows');
  });

  it('approves several titles waiting on approval at once', async () => {
    const user = userEvent.setup();

    aPanel();

    await user.click(await screen.findByRole('button', { name: 'Select several' }));
    await user.click(screen.getByRole('checkbox', { name: /Asked Film/ }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(decideMediaRequests).toHaveBeenCalledWith([ASKED.id], 'approve', '');
    });
  });

  it('searches for everything missing', async () => {
    aPanel();

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Search all missing' }));

    await waitFor(() => {
      expect(searchMissing).toHaveBeenCalled();
    });
  });

  it('finds titles by name', async () => {
    const user = userEvent.setup();

    aPanel();

    await user.type(await screen.findByRole('searchbox', { name: 'Find a title' }), 'asked');

    expect(screen.queryByRole('button', { name: /Held Film/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Asked Film/ })).toBeInTheDocument();
  });

  it('has no tab for a kind of library the server lacks', async () => {
    aPanel();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Music' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Shows' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Books' })).not.toBeInTheDocument();
  });

  it('opens on the first tab there is where the one asked for has no library', async () => {
    held.kinds = ['shows'];

    aPanel({ tab: 'films' });

    expect(await screen.findByRole('button', { name: /A Show/ })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CataloguePanel.displayName).toBe('CataloguePanel');
  });
});
