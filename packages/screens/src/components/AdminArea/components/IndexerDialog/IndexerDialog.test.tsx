import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { IndexerDialog } from './IndexerDialog';
import type { Indexer, IndexerTest } from '@ValenceContracts/schemas/Indexer';
import type * as Indexers from '@ValenceClient/requests/fetchIndexers';

const addIndexer = vi.fn<typeof Indexers.addIndexer>();
const changeIndexer = vi.fn<typeof Indexers.changeIndexer>();
const tryIndexer = vi.fn<typeof Indexers.tryIndexer>();

vi.mock('@ValenceClient/requests/fetchIndexers', () => ({
  addIndexer: (...given: Parameters<typeof Indexers.addIndexer>) => addIndexer(...given),
  changeIndexer: (...given: Parameters<typeof Indexers.changeIndexer>) => changeIndexer(...given),
  tryIndexer: (...given: Parameters<typeof Indexers.tryIndexer>) => tryIndexer(...given),
}));

const KEPT: Indexer = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  hasApiKey: true,
  definitionId: null,
  settings: {},
  secretsSet: [],
  privacy: null,
  priority: 25,
  isEnabled: true,
  categories: [],
  requestsPerMinute: null,
  timeoutSeconds: 30,
  capabilities: {
    categories: [
      { id: 2000, name: 'Movies', subcategories: [] },
      { id: 5000, name: 'TV', subcategories: [] },
    ],
    modes: [{ mode: 'search', parameters: ['q'] }],
    limit: null,
  },
  failures: 0,
  lastProblem: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const WORKING: IndexerTest = {
  isWorking: true,
  problem: null,
  capabilities: { categories: [], modes: [{ mode: 'movie', parameters: ['q'] }], limit: null },
  captcha: null,
};

/**
 * Opens the dialog on an indexer, or on a new one.
 */
const open = (indexer: Indexer | null = null) => {
  const handlers = { onClose: vi.fn(), onSaved: vi.fn() };

  renderInAnAddress(<IndexerDialog isOpen indexer={indexer} {...handlers} />);

  return handlers;
};

/**
 * Fills in what a new indexer needs.
 */
const fillIn = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: /Name/ }), 'NZBgeek');
  await user.type(screen.getByRole('textbox', { name: /Address/ }), 'https://api.nzbgeek.info');
  await user.type(screen.getByLabelText(/API key/), 'a-key');
};

beforeEach(() => {
  addIndexer.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  changeIndexer.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  tryIndexer.mockReset().mockResolvedValue({ value: WORKING, refusal: null });
});

describe('IndexerDialog', () => {
  it('adds an indexer, and says it was kept', async () => {
    const user = userEvent.setup();
    const { onSaved, onClose } = open();

    await user.click(screen.getByRole('button', { name: 'Newznab' }));
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Add indexer' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(KEPT);
    });
    expect(addIndexer).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'newznab', name: 'NZBgeek', apiKey: 'a-key' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('says what is wrong with the form before sending anything', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'Add indexer' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Give the indexer a name.');
    expect(addIndexer).not.toHaveBeenCalled();
  });

  it('says why the server refused it', async () => {
    addIndexer.mockResolvedValue({ value: null, refusal: { message: 'That is not an indexer.' } });

    const user = userEvent.setup();
    const { onSaved } = open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Add indexer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That is not an indexer.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('still says something where the server gave no reason', async () => {
    addIndexer.mockResolvedValue({ value: null, refusal: null });

    const user = userEvent.setup();

    open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Add indexer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That could not be saved.');
  });

  it('tries an indexer before it is kept, saying what it can search', async () => {
    const user = userEvent.setup();

    open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'It answered, and can search movie.',
    );
    expect(tryIndexer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'NZBgeek' }),
      undefined,
    );
  });

  it('says why an indexer did not answer when tried', async () => {
    tryIndexer.mockResolvedValue({
      value: {
        isWorking: false,
        problem: 'The indexer refused the API key',
        capabilities: null,
        captcha: null,
      },
      refusal: null,
    });

    const user = userEvent.setup();

    open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByRole('status')).toHaveTextContent('The indexer refused the API key');
  });

  it('says where trying it was refused altogether', async () => {
    tryIndexer.mockResolvedValue({ value: null, refusal: { message: 'Requesting is off.' } });

    const user = userEvent.setup();

    open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Requesting is off.');
  });

  it('tries nothing that is not filled in properly', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(tryIndexer).not.toHaveBeenCalled();
  });

  it('changes a kept indexer without sending a key nobody typed', async () => {
    const user = userEvent.setup();

    open(KEPT);

    expect(screen.getByText(/A key is kept/)).toBeInTheDocument();

    await user.clear(screen.getByRole('spinbutton', { name: /Priority/ }));
    await user.type(screen.getByRole('spinbutton', { name: /Priority/ }), '3');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeIndexer).toHaveBeenCalled();
    });

    const [id, change] = changeIndexer.mock.calls[0] ?? [];

    expect(id).toBe(KEPT.id);
    expect(change).toMatchObject({ priority: 3 });
    expect(change).not.toHaveProperty('apiKey');
  });

  it('sends a new key where somebody typed one', async () => {
    const user = userEvent.setup();

    open(KEPT);

    await user.type(screen.getByLabelText(/API key/), 'new-key');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeIndexer).toHaveBeenCalledWith(
        KEPT.id,
        expect.objectContaining({ apiKey: 'new-key' }),
      );
    });
  });

  it('tries a change with the key already kept', async () => {
    const user = userEvent.setup();

    open(KEPT);

    await user.click(screen.getByRole('button', { name: 'Try it' }));

    await waitFor(() => {
      expect(tryIndexer).toHaveBeenCalledWith(expect.objectContaining({ apiKey: '' }), KEPT.id);
    });
  });

  it('narrows the search to the categories chosen', async () => {
    const user = userEvent.setup();

    open(KEPT);

    await user.click(screen.getByRole('checkbox', { name: 'TV' }));
    await user.click(screen.getByRole('checkbox', { name: 'Movies' }));
    await user.click(screen.getByRole('checkbox', { name: 'TV' }));
    await user.click(screen.getByRole('switch', { name: 'Search this indexer' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeIndexer).toHaveBeenCalledWith(
        KEPT.id,
        expect.objectContaining({ categories: [2000], isEnabled: false }),
      );
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(IndexerDialog.displayName).toBe('IndexerDialog');
  });
});
