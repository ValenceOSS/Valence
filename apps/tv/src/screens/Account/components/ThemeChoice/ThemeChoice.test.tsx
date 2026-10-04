import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { chosenPluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { keptPluginTheme } from '@ValenceClient/plugins/keptPluginTheme';
import { ThemeChoice } from '@ValenceTv/screens/Account/components/ThemeChoice/ThemeChoice';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));

const Scope = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('ThemeChoice', () => {
  it('chooses a plugin theme, keeps its colours and says it applies next time', async () => {
    jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
    const drawn = await render(<ThemeChoice />, { wrapper: Scope });

    await userEvent.press(await drawn.findByText('Midnight'));

    expect(chosenPluginTheme()).toBe('night-sky/midnight');
    expect(keptPluginTheme('night-sky/midnight')?.dark?.surface).toBe('#0b0d12');
    expect(drawn.getByText('This theme is applied the next time you open Valence.')).toBeTruthy();

    await userEvent.press(drawn.getByText('Valence'));

    expect(chosenPluginTheme()).toBeNull();
  });

  it('offers nothing where no plugin has a dark theme', async () => {
    jest
      .mocked(fetchPluginContributions)
      .mockResolvedValue(somePluginContributions({ themes: [] }));
    const drawn = await render(<ThemeChoice />, { wrapper: Scope });

    expect(drawn.toJSON()).toBeNull();
  });
});
