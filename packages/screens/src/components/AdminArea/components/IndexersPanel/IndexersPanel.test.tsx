import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { IndexersPanel } from './IndexersPanel';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';
import type * as Indexers from '@ValenceClient/requests/fetchIndexers';
import type * as Definitions from '@ValenceClient/requests/fetchDefinitions';

const fetchIndexers = vi.fn<typeof Indexers.fetchIndexers>();
const fetchCatalogue = vi.fn<typeof Definitions.fetchCatalogue>();

vi.mock('@ValenceClient/requests/fetchDefinitions', () => ({
  fetchCatalogue: () => fetchCatalogue(),
  refreshCatalogue: vi.fn(),
  fetchDefinition: () => new Promise(() => undefined),
}));
const changeIndexer = vi.fn<typeof Indexers.changeIndexer>();
const removeIndexer = vi.fn<typeof Indexers.removeIndexer>();
const testIndexer = vi.fn<typeof Indexers.testIndexer>();

vi.mock('@ValenceClient/requests/fetchIndexers', () => ({
  fetchIndexers: () => fetchIndexers(),
  changeIndexer: (...given: Parameters<typeof Indexers.changeIndexer>) => changeIndexer(...given),
  removeIndexer: (...given: Parameters<typeof Indexers.removeIndexer>) => removeIndexer(...given),
  testIndexer: (...given: Parameters<typeof Indexers.testIndexer>) => testIndexer(...given),
  addIndexer: vi.fn(),
  tryIndexer: vi.fn(),
}));

/**
 * An indexer, with anything the test cares about changed.
 */
const anIndexer = (overrides: Partial<Indexer> = {}): Indexer => ({
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
  capabilities: { categories: [], modes: [{ mode: 'movie', parameters: ['q'] }], limit: null },
  failures: 0,
  lastProblem: null,
  lastProblemCode: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

/**
 * Opens the actions for the one indexer and picks one.
 */
const choose = async (user: ReturnType<typeof userEvent.setup>, action: string) => {
  await user.click(await screen.findByRole('button', { name: 'Actions for Jackett' }));
  await user.click(await screen.findByRole('menuitem', { name: new RegExp(action) }));
};

beforeEach(() => {
  fetchCatalogue.mockReset().mockResolvedValue({
    definitions: [
      {
        id: 'rutor',
        name: 'RuTor',
        description: 'A Russian tracker',
        language: 'ru-RU',
        privacy: 'public',
        protocol: 'torrent',
        categories: ['TV'],
      },
    ],
    updatedAt: null,
    source: 'Prowlarr/Indexers@master/definitions/v11',
    problem: null,
  });
  fetchIndexers.mockReset().mockResolvedValue([anIndexer()]);
  changeIndexer.mockReset().mockResolvedValue({ value: anIndexer(), refusal: null });
  removeIndexer.mockReset().mockResolvedValue(null);
  testIndexer.mockReset().mockResolvedValue({
    value: { isWorking: true, problem: null, problemCode: null, capabilities: null, captcha: null },
    refusal: null,
  });
});

describe('IndexersPanel', () => {
  it('lists each indexer, how it is and what it can search', async () => {
    renderInAnAddress(<IndexersPanel />);

    expect(await screen.findByText('Jackett')).toBeInTheDocument();
    expect(screen.getByText('Torznab')).toBeInTheDocument();
    expect(screen.getByText('Working')).toBeInTheDocument();
    expect(screen.getByText('Films')).toBeInTheDocument();
  });

  it('says why an indexer was turned off', async () => {
    fetchIndexers.mockResolvedValue([
      anIndexer({
        isEnabled: false,
        turnedOffBecause: 'Turned off after 5 failures in a row: Timed out',
        removesWhenDone: null,
        seedSeconds: null,
        seedRatio: null,
      }),
    ]);

    renderInAnAddress(<IndexersPanel />);

    expect(await screen.findByText('Turned off')).toBeInTheDocument();
    expect(screen.getByText('Turned off after 5 failures in a row: Timed out')).toBeInTheDocument();
  });

  it('says there are none yet, and how to add one', async () => {
    fetchIndexers.mockResolvedValue([]);

    renderInAnAddress(<IndexersPanel />);

    expect(await screen.findByText(/No indexers yet/)).toBeInTheDocument();
  });

  it('opens the dialog to add one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await user.click(screen.getByRole('button', { name: 'Add an indexer' }));

    expect(await screen.findByRole('dialog', { name: 'Add an indexer' })).toBeInTheDocument();
  });

  it('adds a site chosen from the catalogue, going back to the catalogue from it', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await user.click(screen.getByRole('button', { name: 'Add an indexer' }));
    await user.type(await screen.findByRole('searchbox', { name: 'Find a site' }), 'Ru');
    await user.click(await screen.findByText('RuTor'));

    expect(await screen.findByRole('dialog', { name: 'Add RuTor' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('dialog', { name: 'Add an indexer' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Add RuTor' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Find a site' })).toHaveValue('Ru');
  });

  it('closes the catalogue without adding anything', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await user.click(screen.getByRole('button', { name: 'Add an indexer' }));
    await user.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows a site’s privacy in place of its kind', async () => {
    fetchIndexers.mockResolvedValue([
      anIndexer({ kind: 'cardigann', privacy: 'private', definitionId: 'hdb' }),
    ]);

    renderInAnAddress(<IndexersPanel />);

    expect(await screen.findByText('Private site')).toBeInTheDocument();
  });

  it('opens the dialog to change one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Change');

    const dialog = await screen.findByRole('dialog', { name: 'Change Jackett' });

    expect(within(dialog).getByRole('textbox', { name: /Name/ })).toHaveValue('Jackett');

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('tests one, and reads the list again', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Test');

    await waitFor(() => {
      expect(testIndexer).toHaveBeenCalledWith(anIndexer().id);
    });
    await waitFor(() => {
      expect(fetchIndexers).toHaveBeenCalledTimes(2);
    });
  });

  it('tests all that are on or were turned off, not those somebody switched off', async () => {
    fetchIndexers.mockResolvedValue([
      anIndexer({ id: 'on', name: 'Jackett' }),
      anIndexer({
        id: 'turned-off',
        name: 'Prowlarr',
        isEnabled: false,
        turnedOffBecause: 'Turned off after 5 failures in a row: Timed out',
      }),
      anIndexer({ id: 'switched-off', name: 'Torrents', isEnabled: false }),
    ]);

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await screen.findByText('Jackett');
    await user.click(screen.getByRole('button', { name: /Test all/ }));

    await waitFor(() => {
      expect(fetchIndexers).toHaveBeenCalledTimes(2);
    });
    expect(testIndexer.mock.calls).toEqual([['on'], ['turned-off']]);
  });

  it('says which of them failed and why', async () => {
    fetchIndexers.mockResolvedValue([
      anIndexer({ id: 'on', name: 'Jackett' }),
      anIndexer({ id: 'failing', name: 'Prowlarr' }),
    ]);
    testIndexer.mockImplementation((id) =>
      Promise.resolve({
        value: {
          isWorking: id === 'on',
          problem: id === 'on' ? null : 'Timed out',
          problemCode: null,
          capabilities: null,
          captcha: null,
        },
        refusal: null,
      }),
    );

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await screen.findByText('Jackett');
    await user.click(screen.getByRole('button', { name: /Test all/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '1 of 2 answered. Prowlarr: Timed out',
    );
  });

  it('still sums up the rest where one answer could not be read', async () => {
    fetchIndexers.mockResolvedValue([
      anIndexer({ id: 'on', name: 'Jackett' }),
      anIndexer({ id: 'broken', name: 'Prowlarr' }),
    ]);
    testIndexer.mockImplementation((id) =>
      id === 'broken'
        ? Promise.reject(new Error('Unexpected token'))
        : Promise.resolve({
            value: {
              isWorking: true,
              problem: null,
              problemCode: null,
              capabilities: null,
              captcha: null,
            },
            refusal: null,
          }),
    );

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await screen.findByText('Jackett');
    await user.click(screen.getByRole('button', { name: /Test all/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '1 of 2 answered. Prowlarr: its answer could not be read',
    );
    expect(screen.queryByLabelText(/^Testing /)).not.toBeInTheDocument();
  });

  it('shows a spinner only for the indexers being tested, not those waiting their turn', async () => {
    fetchIndexers.mockResolvedValue(
      ['a', 'b', 'c', 'd', 'e'].map((letter) =>
        anIndexer({ id: letter, name: `Indexer ${letter}` }),
      ),
    );
    testIndexer.mockImplementation(() => new Promise(() => undefined));

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await screen.findByText('Indexer a');
    await user.click(screen.getByRole('button', { name: /Test all/ }));

    await waitFor(() => {
      expect(screen.getAllByLabelText(/^Testing Indexer/)).toHaveLength(4);
    });
    expect(screen.queryByLabelText('Testing Indexer e')).not.toBeInTheDocument();
  });

  it('has nothing to test where every indexer was switched off', async () => {
    fetchIndexers.mockResolvedValue([anIndexer({ isEnabled: false })]);

    renderInAnAddress(<IndexersPanel />);

    await screen.findByText('Jackett');

    expect(screen.getByRole('button', { name: /Test all/ })).toBeDisabled();
  });

  it('says why a test failed', async () => {
    testIndexer.mockResolvedValue({
      value: {
        isWorking: false,
        problem: 'The indexer refused the API key',
        problemCode: null,
        capabilities: null,
        captcha: null,
      },
      refusal: null,
    });

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Test');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Jackett: The indexer refused the API key',
    );
  });

  it('still says a test failed where no reason came back', async () => {
    testIndexer.mockResolvedValue({
      value: {
        isWorking: false,
        problem: null,
        problemCode: null,
        capabilities: null,
        captcha: null,
      },
      refusal: null,
    });

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Test');

    expect(await screen.findByRole('alert')).toHaveTextContent('Jackett: did not answer');
  });

  it('says why a test could not be run at all', async () => {
    testIndexer.mockResolvedValue({ value: null, refusal: { message: 'Requesting is off.' } });

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Test');

    expect(await screen.findByRole('alert')).toHaveTextContent('Jackett: Requesting is off.');
  });

  it('switches one off, and back on', async () => {
    fetchIndexers
      .mockResolvedValueOnce([anIndexer()])
      .mockResolvedValue([anIndexer({ isEnabled: false })]);

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Switch off');

    await waitFor(() => {
      expect(changeIndexer).toHaveBeenCalledWith(anIndexer().id, { isEnabled: false });
    });

    changeIndexer.mockResolvedValue({ value: null, refusal: { message: 'No such indexer.' } });

    await screen.findByText('Off');
    await choose(user, 'Switch on');

    expect(await screen.findByRole('alert')).toHaveTextContent('No such indexer.');
  });

  it('removes one only once somebody confirms', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Remove');

    expect(removeIndexer).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(removeIndexer).toHaveBeenCalledWith(anIndexer().id);
    });
  });

  it('says why a removal was refused', async () => {
    removeIndexer.mockResolvedValue({ message: 'No such indexer.' });

    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Remove');
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No such indexer.');
  });

  it('keeps an indexer when the removal is thought better of', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<IndexersPanel />);

    await choose(user, 'Remove');
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(removeIndexer).not.toHaveBeenCalled();
  });

  it('says it could not read the indexers, and offers to try again', async () => {
    fetchIndexers.mockRejectedValue(new Error('offline'));

    renderInAnAddress(<IndexersPanel />);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(IndexersPanel.displayName).toBe('IndexersPanel');
  });
});
