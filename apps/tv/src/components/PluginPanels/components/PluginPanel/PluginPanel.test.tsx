import { Alert } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { actOnPluginSurface } from '@ValenceClient/plugins/actOnPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { PluginPanel } from '@ValenceTv/components/PluginPanels/components/PluginPanel/PluginPanel';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: jest.fn() }));
jest.mock('@ValenceClient/plugins/actOnPluginSurface', () => ({ actOnPluginSurface: jest.fn() }));

const Scope = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const props = {
  pluginId: 'anilist',
  pluginName: 'AniList',
  panelId: 'score',
  title: 'Score',
  on: 'title' as const,
  subjectId: '00000000-0000-4000-8000-000000000001',
};

describe('PluginPanel', () => {
  it('says an account has to be connected on another device', async () => {
    jest.spyOn(Alert, 'alert');
    jest.mocked(fetchPluginSurface).mockResolvedValue(
      SurfaceSchema.parse({
        blocks: [
          {
            type: 'button',
            label: 'Connect AniList',
            action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
          },
        ],
      }),
    );
    jest.mocked(actOnPluginSurface).mockResolvedValue({
      kind: 'navigate',
      to: '/api/plugins/anilist/accounts/anilist/connect',
    });
    const drawn = await render(<PluginPanel {...props} />, { wrapper: Scope });

    await userEvent.press(await drawn.findByText('Connect AniList'));

    expect(await drawn.findByText(/on your phone or on the web/u)).toBeTruthy();
  });

  it('leaves out a panel that cannot be read', async () => {
    jest.mocked(fetchPluginSurface).mockRejectedValue(new Error('Away'));
    const drawn = await render(<PluginPanel {...props} />, { wrapper: Scope });

    expect(drawn.toJSON()).toBeNull();
  });
});
