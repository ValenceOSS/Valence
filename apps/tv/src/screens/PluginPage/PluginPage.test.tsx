import { Alert } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { actOnPluginSurface } from '@ValenceClient/plugins/actOnPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { PluginPage } from '@ValenceTv/screens/PluginPage/PluginPage';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));
jest.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: jest.fn() }));
jest.mock('@ValenceClient/plugins/actOnPluginSurface', () => ({ actOnPluginSurface: jest.fn() }));

const mockWithdrawn: {
  pluginId: string | null;
  tell: (change: { pluginId: string; change: 'disabled' | 'removed' }) => void;
} = { pluginId: null, tell: () => undefined };

jest.mock('@ValenceClient/plugins/usePluginWithdrawn', () => ({
  usePluginWithdrawn: (
    pluginId: string | null,
    onWithdrawn: (change: { pluginId: string; change: 'disabled' | 'removed' }) => void,
  ) => {
    mockWithdrawn.pluginId = pluginId;
    mockWithdrawn.tell = onWithdrawn;
  },
}));

const Scope = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const CONNECT = SurfaceSchema.parse({
  blocks: [
    { type: 'text', text: 'Keep your anime list in step.' },
    {
      type: 'button',
      label: 'Connect AniList',
      action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
    },
  ],
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
});

describe('PluginPage', () => {
  it('draws the page under its title, named with the plugin it comes from', async () => {
    jest.mocked(fetchPluginSurface).mockResolvedValue(CONNECT);
    const drawn = await render(
      <PluginPage pluginId="anilist" pageId="tracking" onGone={jest.fn()} />,
      {
        wrapper: Scope,
      },
    );

    expect(await drawn.findByText('Keep your anime list in step.')).toBeTruthy();
    expect(drawn.getByText('Anime tracking')).toBeTruthy();
    expect(drawn.getByText('From AniList')).toBeTruthy();
    expect(fetchPluginSurface).toHaveBeenCalledWith({
      kind: 'page',
      pluginId: 'anilist',
      pageId: 'tracking',
    });
  });

  it('finishes connecting an account on a phone, then reads the page again', async () => {
    jest.mocked(fetchPluginSurface).mockResolvedValue(CONNECT);
    jest.mocked(actOnPluginSurface).mockResolvedValue({
      kind: 'navigate',
      to: '/api/plugins/anilist/accounts/anilist/connect?ticket=abc',
    });
    const drawn = await render(
      <PluginPage pluginId="anilist" pageId="tracking" onGone={jest.fn()} />,
      {
        wrapper: Scope,
      },
    );

    await userEvent.press(await drawn.findByText('Connect AniList'));

    expect(await drawn.findByText('Sign in on your phone')).toBeTruthy();
    expect(drawn.queryByText('Keep your anime list in step.')).toBeNull();

    await userEvent.press(drawn.getByText('Done'));

    expect(await drawn.findByText('Keep your anime list in step.')).toBeTruthy();
    expect(fetchPluginSurface).toHaveBeenCalledTimes(2);
  });

  it('offers to try again when the page cannot be read', async () => {
    jest.mocked(fetchPluginSurface).mockRejectedValueOnce(new Error('Away'));
    jest.mocked(fetchPluginSurface).mockResolvedValueOnce(CONNECT);
    const drawn = await render(
      <PluginPage pluginId="anilist" pageId="tracking" onGone={jest.fn()} />,
      {
        wrapper: Scope,
      },
    );

    expect(await drawn.findByText('Couldn’t load this page.')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));

    expect(await drawn.findByText('Keep your anime list in step.')).toBeTruthy();
  });

  it('leaves, and says why, when an administrator turns the plugin off', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onGone = jest.fn();

    jest.mocked(fetchPluginSurface).mockResolvedValue(CONNECT);
    const drawn = await render(
      <PluginPage pluginId="anilist" pageId="tracking" onGone={onGone} />,
      {
        wrapper: Scope,
      },
    );

    expect(await drawn.findByText('From AniList')).toBeTruthy();

    await waitFor(() => {
      mockWithdrawn.tell({ pluginId: 'anilist', change: 'disabled' });

      expect(alert).toHaveBeenLastCalledWith('AniList was turned off by an administrator.');
    });
    expect(onGone).toHaveBeenCalled();
    expect(mockWithdrawn.pluginId).toBe('anilist');
  });
});
