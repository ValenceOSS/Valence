import { Alert } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { actOnPluginSurface } from '@ValenceClient/plugins/actOnPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { openOnThePhone } from '@ValenceMobile/plugins/openOnThePhone';
import { APluginPage } from './APluginPage';

jest.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: jest.fn() }));
jest.mock('@ValenceClient/plugins/actOnPluginSurface', () => ({ actOnPluginSurface: jest.fn() }));
jest.mock('@ValenceMobile/plugins/openOnThePhone', () => ({
  openOnThePhone: jest.fn(() => Promise.resolve()),
}));

const page = SurfaceSchema.parse({
  blocks: [
    { type: 'text', text: 'Not connected yet.' },
    {
      type: 'button',
      label: 'Connect AniList',
      action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
    },
    {
      type: 'button',
      label: 'Forget everything',
      action: { id: 'forget', confirm: 'Forget every show?' },
    },
  ],
});

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchPluginSurface).mockClear();
  jest.mocked(fetchPluginSurface).mockResolvedValue(page);
});

describe('APluginPage', () => {
  it('draws the page the plugin sent and replaces it with what it draws next', async () => {
    jest.mocked(actOnPluginSurface).mockResolvedValue({
      kind: 'surface',
      surface: SurfaceSchema.parse({ blocks: [{ type: 'text', text: 'Connected as dan.' }] }),
    });
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, choices) => {
      choices?.find((choice) => choice.text === 'Continue')?.onPress?.();
    });
    const drawn = await render(<APluginPage pluginId="anilist" pageId="tracking" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Forget everything'));

    expect(await drawn.findByText('Connected as dan.')).toBeTruthy();
    expect(actOnPluginSurface).toHaveBeenCalledWith(
      { kind: 'page', pluginId: 'anilist', pageId: 'tracking' },
      { action: { id: 'forget', confirm: 'Forget every show?' }, fields: {} },
    );
  });

  it('opens the page the server sends somebody to, then reads the page again', async () => {
    jest.mocked(actOnPluginSurface).mockResolvedValue({
      kind: 'navigate',
      to: '/api/plugins/anilist/accounts/anilist/connect',
    });
    const drawn = await render(<APluginPage pluginId="anilist" pageId="tracking" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Connect AniList'));

    await waitFor(() => {
      expect(openOnThePhone).toHaveBeenCalledWith('/api/plugins/anilist/accounts/anilist/connect');
    });
    await waitFor(() => {
      expect(fetchPluginSurface).toHaveBeenCalledTimes(2);
    });
  });

  it('sends nothing when somebody does not confirm', async () => {
    jest.mocked(actOnPluginSurface).mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, choices) => {
      choices?.find((choice) => choice.text === 'Cancel')?.onPress?.();
    });
    const drawn = await render(<APluginPage pluginId="anilist" pageId="tracking" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Forget everything'));

    expect(actOnPluginSurface).not.toHaveBeenCalled();
  });

  it('says so in its own words where a press fails', async () => {
    jest.mocked(actOnPluginSurface).mockRejectedValue(new Error('The plugin could not do that.'));
    const drawn = await render(<APluginPage pluginId="anilist" pageId="tracking" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Connect AniList'));

    expect(await drawn.findByText('The plugin could not do that.')).toBeTruthy();
  });

  it('offers to try again where the page cannot be read', async () => {
    jest
      .mocked(fetchPluginSurface)
      .mockRejectedValueOnce(new Error('Away'))
      .mockResolvedValue(page);
    const drawn = await render(<APluginPage pluginId="anilist" pageId="tracking" />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Try again'));

    expect(await drawn.findByText('Not connected yet.')).toBeTruthy();
  });
});
