import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aPlugin } from '@ValenceClient/testing/aPlugin';
import { anInstallPreview } from '@ValenceClient/testing/anInstallPreview';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginsPanel } from './PluginsPanel';

const fetchInstalledPlugins = vi.hoisted(() => vi.fn());
const fetchPluginCatalogue = vi.hoisted(() => vi.fn());
const previewCataloguePlugin = vi.hoisted(() => vi.fn());
const uploadPluginPackage = vi.hoisted(() => vi.fn());
const changePlugin = vi.hoisted(() => vi.fn());
const removePlugin = vi.hoisted(() => vi.fn());
const told = vi.hoisted(() => ({ worked: vi.fn(), failed: vi.fn() }));

vi.mock('@ValenceClient/plugins/fetchInstalledPlugins', () => ({ fetchInstalledPlugins }));
vi.mock('@ValenceClient/plugins/fetchPluginCatalogue', () => ({ fetchPluginCatalogue }));
vi.mock('@ValenceClient/plugins/previewCataloguePlugin', () => ({ previewCataloguePlugin }));
vi.mock('@ValenceClient/plugins/uploadPluginPackage', () => ({ uploadPluginPackage }));
vi.mock('@ValenceClient/plugins/changePlugin', () => ({ changePlugin }));
vi.mock('@ValenceClient/plugins/removePlugin', () => ({ removePlugin }));
vi.mock('@ValenceUI/notify', () => ({ notify: told }));

const fetchPluginSurface = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface }));

const CATALOGUE_ENTRY = {
  id: 'music-import',
  name: 'Music import',
  description: 'Brings your playlists in.',
  author: 'Valence',
  version: '1.2.0',
  kinds: ['extension'],
  permissions: [],
  iconUrl: null,
  sourceUrl: 'https://github.com/ValenceOSS/valence-plugins',
  installedVersion: null,
  isCompatible: true,
};

beforeEach(() => {
  fetchInstalledPlugins.mockReset().mockResolvedValue([aPlugin()]);
  fetchPluginCatalogue
    .mockReset()
    .mockResolvedValue({ isReachable: true, problem: null, plugins: [CATALOGUE_ENTRY] });
  previewCataloguePlugin.mockReset().mockResolvedValue(anInstallPreview());
  uploadPluginPackage.mockReset().mockResolvedValue(anInstallPreview({ trust: 'unsigned' }));
  changePlugin.mockReset().mockResolvedValue(undefined);
  removePlugin.mockReset().mockResolvedValue(undefined);
  told.worked.mockReset();
  told.failed.mockReset();
});

describe('PluginsPanel', () => {
  it('lists what is installed and what the catalogue offers', async () => {
    renderInAnAddress(<PluginsPanel />);

    expect(await screen.findByText('AniList')).toBeInTheDocument();
    expect(await screen.findByText('Music import')).toBeInTheDocument();
  });

  it('reviews a catalogue plugin before installing it', async () => {
    renderInAnAddress(<PluginsPanel />);

    await userEvent.click(await screen.findByRole('button', { name: 'Install' }));

    expect(await screen.findByRole('dialog', { name: 'Install a plugin' })).toBeInTheDocument();
    expect(previewCataloguePlugin).toHaveBeenCalledWith('music-import');
  });

  it('reviews a package from a file, unsigned and all', async () => {
    renderInAnAddress(<PluginsPanel />);

    const input = await screen.findByLabelText(/Install from a file/u);

    await userEvent.upload(input, [
      new File(['x'], 'thing.vplugin'),
      new File(['s'], 'thing.vplugin.sig'),
    ]);

    expect(await screen.findByText('Valence cannot vouch for this plugin')).toBeInTheDocument();
    expect(uploadPluginPackage).toHaveBeenCalledWith(expect.any(File), expect.any(File));
  });

  it('asks for a .vplugin when given anything else', async () => {
    renderInAnAddress(<PluginsPanel />);

    await userEvent.upload(
      await screen.findByLabelText(/Install from a file/u),
      new File(['x'], 'thing.sig'),
    );

    expect(told.failed).toHaveBeenCalled();
    expect(uploadPluginPackage).not.toHaveBeenCalled();
  });

  it('turns a plugin off, and removes one after asking', async () => {
    renderInAnAddress(<PluginsPanel />);

    await userEvent.click(await screen.findByRole('switch', { name: 'Turn AniList off' }));

    await waitFor(() => {
      expect(changePlugin).toHaveBeenCalledWith('anilist', { isEnabled: false });
    });

    await userEvent.click(screen.getByRole('button', { name: /Remove/u }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove it' }),
    );

    await waitFor(() => {
      expect(removePlugin).toHaveBeenCalledWith('anilist');
    });
  });

  it('says when the catalogue cannot be reached, and when nothing is installed', async () => {
    fetchInstalledPlugins.mockResolvedValue([]);
    fetchPluginCatalogue.mockResolvedValue({
      isReachable: false,
      problem: 'GitHub did not answer.',
      plugins: [],
    });

    renderInAnAddress(<PluginsPanel />);

    expect(await screen.findByText('GitHub did not answer.')).toBeInTheDocument();
    expect(await screen.findByText(/No plugins yet/u)).toBeInTheDocument();
  });

  it('opens a plugin’s settings and saves them', async () => {
    renderInAnAddress(<PluginsPanel />);

    await userEvent.click(await screen.findByRole('button', { name: /Settings/u }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changePlugin.mock.calls[0]?.[0]).toBe('anilist');
    });
    expect(changePlugin.mock.calls[0]?.[1]).toHaveProperty('settings');
  });

  it('fetches a newer version to review, and opens a plugin’s administrator page', async () => {
    fetchInstalledPlugins.mockResolvedValue([
      aPlugin({
        updateAvailable: '1.1.0',
        pages: [{ id: 'log', title: 'Sync log', placement: 'admin' }],
      }),
    ]);
    fetchPluginSurface.mockResolvedValue({ blocks: [{ type: 'text', text: 'All in step' }] });

    renderInAnAddress(<PluginsPanel />);

    await userEvent.click(await screen.findByRole('button', { name: 'Update to 1.1.0' }));

    await waitFor(() => {
      expect(previewCataloguePlugin).toHaveBeenCalledWith('anilist');
    });

    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Install a plugin' })).getByRole('button', {
        name: 'Cancel',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sync log' }));

    expect(await screen.findByText('All in step')).toBeInTheDocument();
  });

  it('says so when something could not be done', async () => {
    changePlugin.mockRejectedValue(new Error('It is busy.'));
    previewCataloguePlugin.mockRejectedValue(new Error('The catalogue refused.'));
    removePlugin.mockRejectedValue(new Error('It would not go.'));
    uploadPluginPackage.mockRejectedValue(new Error('Too large.'));

    renderInAnAddress(<PluginsPanel />);

    await userEvent.click(await screen.findByRole('switch', { name: 'Turn AniList off' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Install' }));
    await userEvent.upload(
      screen.getByLabelText(/Install from a file/u),
      new File(['x'], 'big.vplugin'),
    );
    await userEvent.click(screen.getByRole('button', { name: /Remove/u }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove it' }),
    );

    await waitFor(() => {
      expect(told.failed.mock.calls.map(([said]: string[]) => said)).toEqual(
        expect.arrayContaining([
          'It is busy.',
          'The catalogue refused.',
          'Too large.',
          'It would not go.',
        ]),
      );
    });
  });

  it('offers to read the plugins and the catalogue again where they could not be read', async () => {
    fetchInstalledPlugins.mockRejectedValue(new Error('down'));
    fetchPluginCatalogue.mockRejectedValue(new Error('down'));

    renderInAnAddress(<PluginsPanel />);

    expect(await screen.findAllByRole('button', { name: /Try again/u })).toHaveLength(2);
  });

  it('says when the catalogue is empty', async () => {
    fetchPluginCatalogue.mockResolvedValue({ isReachable: true, problem: null, plugins: [] });

    renderInAnAddress(<PluginsPanel />);

    expect(await screen.findByText('The catalogue has no plugins yet.')).toBeInTheDocument();
  });
});
