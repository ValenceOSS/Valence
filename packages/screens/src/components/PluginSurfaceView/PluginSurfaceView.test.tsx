import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginSurfaceView } from './PluginSurfaceView';

const fetchPluginSurface = vi.hoisted(() => vi.fn());
const actOnPluginSurface = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface }));
vi.mock('@ValenceClient/plugins/actOnPluginSurface', () => ({ actOnPluginSurface }));

const PLACE = { kind: 'page', pluginId: 'anilist', pageId: 'tracking' } as const;

const assign = vi.fn();

beforeEach(() => {
  fetchPluginSurface.mockReset().mockResolvedValue({
    blocks: [
      { type: 'text', text: 'Not connected' },
      {
        type: 'button',
        label: 'Connect',
        action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
      },
    ],
  });
  actOnPluginSurface.mockReset();
  assign.mockReset();
  vi.stubGlobal('location', {
    ...window.location,
    assign,
    pathname: '/',
    search: '?account=plugin.anilist.tracking',
    origin: 'http://localhost',
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PluginSurfaceView', () => {
  it('draws what the plugin drew, and what it draws in answer to a press', async () => {
    actOnPluginSurface.mockResolvedValue({
      kind: 'surface',
      surface: { blocks: [{ type: 'text', text: 'Connected' }] },
    });

    renderInAnAddress(<PluginSurfaceView place={PLACE} />);

    expect(await screen.findByText('Not connected')).toBeInTheDocument();

    fetchPluginSurface.mockResolvedValue({ blocks: [{ type: 'text', text: 'Connected' }] });
    await userEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByText('Connected')).toBeInTheDocument();
  });

  it('opens the address the server gives for connecting an account, in this window', async () => {
    actOnPluginSurface.mockResolvedValue({
      kind: 'navigate',
      to: '/api/plugins/anilist/accounts/anilist/connect?ticket=t1',
    });

    renderInAnAddress(<PluginSurfaceView place={PLACE} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(
        '/api/plugins/anilist/accounts/anilist/connect?ticket=t1',
      );
    });
  });

  it('asks first where the plugin asked for that, and sends nothing if somebody backs out', async () => {
    fetchPluginSurface.mockResolvedValue({
      blocks: [
        {
          type: 'button',
          label: 'Clear all history',
          tone: 'danger',
          action: { id: 'reset', confirm: 'This forgets your lists.' },
        },
      ],
    });
    actOnPluginSurface.mockResolvedValue({ kind: 'unchanged' });

    renderInAnAddress(<PluginSurfaceView place={PLACE} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Clear all history' }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('This forgets your lists.')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(actOnPluginSurface).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Clear all history' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Continue' }),
    );

    await waitFor(() => {
      expect(actOnPluginSurface).toHaveBeenCalledWith(PLACE, {
        action: { id: 'reset', confirm: 'This forgets your lists.' },
        fields: {},
      });
    });
  });

  it('reads the page again where the plugin left it as it was', async () => {
    actOnPluginSurface.mockResolvedValue({ kind: 'unchanged' });

    renderInAnAddress(<PluginSurfaceView place={PLACE} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(fetchPluginSurface).toHaveBeenCalledTimes(2);
    });
  });

  it('says in Valence’s own place when a press did not work', async () => {
    actOnPluginSurface.mockRejectedValue(new Error('AniList did not answer.'));

    renderInAnAddress(<PluginSurfaceView place={PLACE} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Connect' }));

    expect(await screen.findByText('AniList did not answer.')).toBeInTheDocument();
  });

  it('says so when the plugin cannot draw at all', async () => {
    fetchPluginSurface.mockRejectedValue(new Error('down'));

    renderInAnAddress(<PluginSurfaceView place={PLACE} />);

    expect(await screen.findByText('This plugin couldn’t load its page')).toBeInTheDocument();

    fetchPluginSurface.mockResolvedValue({ blocks: [{ type: 'text', text: 'Back again' }] });
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Back again')).toBeInTheDocument();
  });
});
