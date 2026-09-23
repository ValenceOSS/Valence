import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { IndexerDialog } from './IndexerDialog';
import type { Indexer, IndexerTest } from '@ValenceContracts/schemas/Indexer';
import type * as Indexers from '@ValenceClient/requests/fetchIndexers';
import type * as Definitions from '@ValenceClient/requests/fetchDefinitions';
import type { IndexerDefinitionDetail } from '@ValenceContracts/schemas/IndexerDefinition';

const addIndexer = vi.fn<typeof Indexers.addIndexer>();
const changeIndexer = vi.fn<typeof Indexers.changeIndexer>();
const tryIndexer = vi.fn<typeof Indexers.tryIndexer>();

const fetchDefinition = vi.fn<typeof Definitions.fetchDefinition>();

vi.mock('@ValenceClient/requests/fetchDefinitions', () => ({
  fetchDefinition: (...given: Parameters<typeof Definitions.fetchDefinition>) =>
    fetchDefinition(...given),
  fetchCatalogue: vi.fn(),
  refreshCatalogue: vi.fn(),
}));

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
  lastProblemCode: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const WORKING: IndexerTest = {
  isWorking: true,
  problem: null,
  problemCode: null,
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

const SITE: IndexerDefinitionDetail = {
  id: 'rutor',
  name: 'RuTor',
  description: 'A Russian tracker',
  language: 'ru-RU',
  privacy: 'private',
  protocol: 'torrent',
  categories: ['TV'],
  links: ['https://rutor.info/', 'https://rutor.is/'],
  settings: [
    {
      name: 'username',
      kind: 'text',
      label: 'Username',
      detail: null,
      default: null,
      options: [],
      isSecret: false,
    },
    {
      name: 'password',
      kind: 'password',
      label: 'Password',
      detail: null,
      default: null,
      options: [],
      isSecret: true,
    },
    {
      name: 'freeleech',
      kind: 'checkbox',
      label: 'Freeleech only',
      detail: null,
      default: false,
      options: [],
      isSecret: false,
    },
    {
      name: 'note',
      kind: 'info',
      label: 'About',
      detail: 'Mind the ratio.',
      default: null,
      options: [],
      isSecret: false,
    },
  ],
  standardCategories: [
    { id: 5000, name: 'TV', subcategories: [] },
    { id: 100_001, name: 'Сериалы', subcategories: [] },
  ],
  hasCaptcha: true,
  isBehindCloudflare: false,
};

beforeEach(() => {
  fetchDefinition.mockReset().mockResolvedValue(SITE);
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

    expect(await screen.findByText('It answered, and can search movie.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try it' }).querySelector('.text-success'),
    ).not.toBeNull();
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
        problemCode: null,
        capabilities: null,
        captcha: null,
      },
      refusal: null,
    });

    const user = userEvent.setup();

    open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The indexer refused the API key');
    expect(
      screen.getByRole('button', { name: 'Try it' }).querySelector('.text-danger'),
    ).not.toBeNull();
  });

  it('spins while it is being tried', async () => {
    let answer: (tried: Awaited<ReturnType<typeof Indexers.tryIndexer>>) => void = () => undefined;

    tryIndexer.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const user = userEvent.setup();

    open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(screen.getByRole('status', { name: 'Working' })).toBeInTheDocument();

    answer({ value: WORKING, refusal: null });

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Working' })).not.toBeInTheDocument();
    });
  });

  it('forgets how it went once something is changed, but not for a category', async () => {
    tryIndexer.mockResolvedValue({
      value: {
        ...WORKING,
        capabilities: {
          categories: [{ id: 2000, name: 'Movies', subcategories: [] }],
          modes: [],
          limit: null,
        },
      },
      refusal: null,
    });

    const user = userEvent.setup();

    open();

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));
    await screen.findByText('It answered, and can search by words.');
    await user.click(screen.getByRole('checkbox', { name: 'Movies' }));

    const tryButton = screen.getByRole('button', { name: 'Try it' });

    expect(tryButton.querySelector('.text-success')).not.toBeNull();

    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'x');

    expect(tryButton.querySelector('.text-success')).toBeNull();
    expect(screen.queryByText(/It answered/)).not.toBeInTheDocument();
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

  describe('a site from the catalogue', () => {
    /**
     * Opens the dialog on a site chosen from the catalogue, or on a kept one.
     */
    const openSite = (indexer: Indexer | null = null) => {
      const handlers = { onClose: vi.fn(), onSaved: vi.fn() };

      renderInAnAddress(
        <IndexerDialog
          isOpen
          indexer={indexer}
          start={
            indexer === null ? { kind: 'cardigann', definitionId: 'rutor', name: 'RuTor' } : null
          }
          {...handlers}
        />,
      );

      return handlers;
    };

    const KEPT_SITE: Indexer = {
      ...KEPT,
      kind: 'cardigann',
      name: 'RuTor',
      url: 'https://rutor.is/',
      hasApiKey: false,
      definitionId: 'rutor',
      settings: { username: 'ada', freeleech: true },
      secretsSet: ['password'],
      privacy: 'private',
      capabilities: null,
    };

    it('asks for what the definition asks for, starting at its first address', async () => {
      openSite();

      expect(await screen.findByText('A Russian tracker')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Address' })).toHaveTextContent(
        'https://rutor.info/',
      );
      expect(screen.getByRole('textbox', { name: /Username/ })).toBeInTheDocument();
      expect(screen.getByText('Mind the ratio.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Torznab' })).not.toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'TV' })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Сериалы' })).not.toBeInTheDocument();
    });

    it('adds it with its definition, the address chosen, and its settings with their defaults', async () => {
      const user = userEvent.setup();
      const { onSaved } = openSite();

      await user.type(await screen.findByRole('textbox', { name: /Username/ }), 'ada');
      await user.type(screen.getByLabelText(/Password/), 'hunter2');
      await user.click(screen.getByRole('button', { name: 'Address' }));
      await user.click(await screen.findByRole('menuitemradio', { name: 'https://rutor.is/' }));
      await user.click(screen.getByRole('button', { name: 'Add indexer' }));

      await waitFor(() => {
        expect(onSaved).toHaveBeenCalled();
      });
      expect(addIndexer).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'cardigann',
          name: 'RuTor',
          url: 'https://rutor.is/',
          definitionId: 'rutor',
          settings: { freeleech: false, username: 'ada', password: 'hunter2' },
        }),
      );
    });

    it('shows a kept secret as kept, and sends only what was changed', async () => {
      const user = userEvent.setup();

      openSite(KEPT_SITE);

      expect(await screen.findByText(/Kept. Type a new one to replace it/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Address' })).toHaveTextContent(
        'https://rutor.is/',
      );

      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(changeIndexer).toHaveBeenCalled();
      });

      const [, change] = changeIndexer.mock.calls[0] ?? [];

      expect(change?.settings).toEqual({ freeleech: true, username: 'ada' });
    });

    it('shows the captcha a try meets, and sends what was typed with the next try', async () => {
      tryIndexer.mockResolvedValueOnce({
        value: {
          isWorking: false,
          problem: 'Type the characters in the picture to log in',
          problemCode: null,
          capabilities: null,
          captcha: { image: 'data:image/png;base64,AQID' },
        },
        refusal: null,
      });

      const user = userEvent.setup();

      openSite();

      await screen.findByText('A Russian tracker');
      await user.click(screen.getByRole('button', { name: 'Try it' }));

      expect(await screen.findByRole('img', { name: 'The characters to type' })).toHaveAttribute(
        'src',
        'data:image/png;base64,AQID',
      );

      await user.type(screen.getByRole('textbox', { name: 'Characters in the picture' }), 'x7k2');
      await user.click(screen.getByRole('button', { name: 'Try it' }));

      await waitFor(() => {
        expect(tryIndexer.mock.calls.at(-1)?.[0].settings?.['CAPTCHA']).toBe('x7k2');
      });
      expect(await screen.findByText(/It answered/)).toBeInTheDocument();
    });

    it('says so when the site’s definition has left the catalogue', async () => {
      fetchDefinition.mockRejectedValue(new Error('gone'));

      openSite(KEPT_SITE);

      expect(
        await screen.findByText('This site’s definition is no longer in the catalogue.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('says what the dialog is for while the definition is read', () => {
      fetchDefinition.mockReturnValue(new Promise(() => undefined));

      openSite();

      expect(screen.getByText('Reading what this site needs…')).toBeInTheDocument();
    });
  });

  it('opens on a generic kind chosen from the catalogue', () => {
    renderInAnAddress(
      <IndexerDialog
        isOpen
        indexer={null}
        start={{ kind: 'newznab' }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Newznab' })).toHaveAttribute('aria-pressed', 'true');
  });
});
