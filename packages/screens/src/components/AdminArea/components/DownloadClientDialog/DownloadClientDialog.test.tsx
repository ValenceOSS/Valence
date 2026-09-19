import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DownloadClientDialog } from './DownloadClientDialog';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type * as Clients from '@ValenceClient/requests/fetchDownloadClients';

const addDownloadClient = vi.fn<typeof Clients.addDownloadClient>();
const changeDownloadClient = vi.fn<typeof Clients.changeDownloadClient>();
const tryDownloadClient = vi.fn<typeof Clients.tryDownloadClient>();

vi.mock('@ValenceClient/requests/fetchDownloadClients', () => ({
  addDownloadClient: (...given: Parameters<typeof Clients.addDownloadClient>) =>
    addDownloadClient(...given),
  changeDownloadClient: (...given: Parameters<typeof Clients.changeDownloadClient>) =>
    changeDownloadClient(...given),
  tryDownloadClient: (...given: Parameters<typeof Clients.tryDownloadClient>) =>
    tryDownloadClient(...given),
}));

const KEPT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Seedbox',
  kind: 'qbittorrent',
  url: 'http://seedbox:8080',
  username: 'admin',
  hasPassword: true,
  hasApiKey: false,
  remotePath: '',
  localPath: '',
  categories: {
    movies: 'valence-films',
    shows: 'valence-series',
    music: 'valence-music',
    books: 'valence-books',
  },
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

beforeEach(() => {
  addDownloadClient.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  changeDownloadClient.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  tryDownloadClient.mockReset().mockResolvedValue({
    value: { isWorking: true, problem: null, version: 'v5.0.1' },
    refusal: null,
  });
});

/**
 * Opens the dialog on a client, or on a new one.
 */
const open = (client: DownloadClient | null = null) => {
  const handlers = { onClose: vi.fn(), onSaved: vi.fn() };
  const shown = renderInAnAddress(<DownloadClientDialog isOpen client={client} {...handlers} />);

  return { ...handlers, ...shown };
};

/**
 * Fills in where a new client is.
 */
const fillIn = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.clear(screen.getByRole('textbox', { name: /Address/ }));
  await user.type(screen.getByRole('textbox', { name: /Address/ }), 'http://localhost:18080');
};

describe('DownloadClientDialog', () => {
  it('adds a qBittorrent client, named for what it is, with its login', async () => {
    const user = userEvent.setup();
    const { onSaved, onClose } = open();

    await user.click(screen.getByRole('button', { name: 'qBittorrent' }));
    await fillIn(user);
    await user.type(screen.getByRole('textbox', { name: /Username/ }), 'admin');
    await user.type(screen.getByLabelText(/Password/), 'secret');
    await user.type(screen.getByRole('textbox', { name: 'As the client sees it' }), '/downloads');
    await user.type(
      screen.getByRole('textbox', { name: 'As Valence sees it' }),
      '/Users/marques/Downloads/Valence',
    );
    await user.click(screen.getByRole('button', { name: 'Add client' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(KEPT);
    });
    expect(onClose).toHaveBeenCalled();
    expect(addDownloadClient).toHaveBeenCalledWith({
      kind: 'qbittorrent',
      name: 'qBittorrent',
      url: 'http://localhost:18080',
      username: 'admin',
      password: 'secret',
      apiKey: '',
      categories: {
        movies: 'valence-films',
        shows: 'valence-series',
        music: 'valence-music',
        books: 'valence-books',
      },
      remotePath: '/downloads',
      localPath: '/Users/marques/Downloads/Valence',
      priority: 25,
      isEnabled: true,
    });
  });

  it('asks SABnzbd for its API key instead of a login', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'SABnzbd' }));

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('SABnzbd');
    expect(screen.getByRole('textbox', { name: /Address/ })).toHaveValue('http://sabnzbd:8080');
    expect(screen.getByLabelText(/API key/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Username/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Transmission' }));

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Transmission');
    expect(screen.getByText(/label Valence puts on what it sends/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Series' })).toHaveValue('valence-series');
  });

  it('keeps a name somebody typed when the kind changes', async () => {
    const user = userEvent.setup();

    open();

    await user.clear(screen.getByRole('textbox', { name: 'Name' }));
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Seedbox');
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'NZBGet' }));

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Seedbox');
    expect(screen.getByRole('textbox', { name: /Address/ })).toHaveValue('http://localhost:18080');
  });

  it('shows a tick once it answered', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'qBittorrent' }));
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByText('It answered, and is v5.0.1.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try it' }).querySelector('.text-success'),
    ).not.toBeNull();
  });

  it('says why it did not answer, beside the buttons', async () => {
    tryDownloadClient.mockResolvedValue({
      value: {
        isWorking: false,
        problem: 'qBittorrent refused the username or password',
        version: null,
      },
      refusal: null,
    });

    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'qBittorrent' }));
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'qBittorrent refused the username or password',
    );
    expect(
      screen.getByRole('button', { name: 'Try it' }).querySelector('.text-danger'),
    ).not.toBeNull();
  });

  it('still says something where no reason was given', async () => {
    tryDownloadClient.mockResolvedValueOnce({
      value: { isWorking: false, problem: null, version: null },
      refusal: null,
    });
    tryDownloadClient.mockResolvedValueOnce({
      value: null,
      refusal: { message: 'Requesting is off.' },
    });
    tryDownloadClient.mockResolvedValueOnce({ value: null, refusal: null });

    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'qBittorrent' }));
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('It did not answer.');

    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByText('Requesting is off.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByText('It could not be tried.')).toBeInTheDocument();
  });

  it('forgets how the last try went once something changes', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'qBittorrent' }));
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Try it' }));
    await screen.findByText(/It answered/);
    await user.type(screen.getByRole('textbox', { name: 'Books' }), 's');

    expect(
      screen.getByRole('button', { name: 'Try it' }).querySelector('.text-success'),
    ).toBeNull();
  });

  it('says what is wrong before trying or saving anything', async () => {
    const user = userEvent.setup();

    open();

    await user.clear(screen.getByRole('textbox', { name: 'Name' }));
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Give the client a name.');

    await user.click(screen.getByRole('button', { name: 'Add client' }));

    expect(tryDownloadClient).not.toHaveBeenCalled();
    expect(addDownloadClient).not.toHaveBeenCalled();
  });

  it('says why it could not be saved', async () => {
    addDownloadClient.mockResolvedValueOnce({
      value: null,
      refusal: { message: 'Requesting is off.' },
    });
    addDownloadClient.mockResolvedValueOnce({ value: null, refusal: null });

    const user = userEvent.setup();
    const { onSaved } = open();

    await user.click(screen.getByRole('button', { name: 'qBittorrent' }));
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Add client' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Requesting is off.');

    await user.click(screen.getByRole('button', { name: 'Add client' }));

    expect(await screen.findByText('That could not be saved.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('changes a kept client, keeping its password unless a new one is typed', async () => {
    const user = userEvent.setup();

    open(KEPT);

    expect(screen.queryByRole('button', { name: 'SABnzbd' })).not.toBeInTheDocument();
    expect(screen.getByText(/A password is kept/)).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Send releases to this client' }));
    await user.click(screen.getByRole('button', { name: 'Try it' }));

    await waitFor(() => {
      expect(tryDownloadClient).toHaveBeenCalledWith(
        expect.objectContaining({ password: '', isEnabled: false }),
        KEPT.id,
      );
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changeDownloadClient).toHaveBeenCalledWith(
        KEPT.id,
        expect.objectContaining({ name: 'Seedbox', password: '' }),
      );
    });
  });

  it('says a kept SABnzbd has its key', () => {
    open({ ...KEPT, kind: 'sabnzbd', hasPassword: false, hasApiKey: true });

    expect(screen.getByText(/A key is kept/)).toBeInTheDocument();
  });

  it('opens afresh on another client', () => {
    const { rerender, onClose, onSaved } = open(KEPT);

    rerender(
      <DownloadClientDialog
        isOpen
        client={{ ...KEPT, id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', name: 'Other' }}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Other');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadClientDialog.displayName).toBe('DownloadClientDialog');
  });
});
