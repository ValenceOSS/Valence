import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { PluginPages } from '@ValenceTv/screens/Account/components/PluginPages/PluginPages';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));

const Scope = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('PluginPages', () => {
  it('opens an account page a plugin adds, named with the plugin', async () => {
    jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
    const onOpen = jest.fn();
    const drawn = await render(<PluginPages onOpen={onOpen} />, { wrapper: Scope });

    await userEvent.press(await drawn.findByRole('button', { name: 'Anime tracking, AniList' }));

    expect(onOpen).toHaveBeenCalledWith({ pluginId: 'anilist', pageId: 'tracking' });
  });

  it('leaves out pages meant for administrators', async () => {
    jest.mocked(fetchPluginContributions).mockResolvedValue(
      somePluginContributions({
        pages: [
          ...somePluginContributions().pages,
          {
            pluginId: 'anilist',
            pluginName: 'AniList',
            pageId: 'setup',
            title: 'Set up',
            placement: 'admin',
            icon: null,
          },
        ],
      }),
    );
    const drawn = await render(<PluginPages onOpen={jest.fn()} />, { wrapper: Scope });

    expect(await drawn.findByText('Anime tracking')).toBeTruthy();
    expect(drawn.queryByText('Set up')).toBeNull();
  });
});
