import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { PluginPanels } from '@ValenceTv/components/PluginPanels/PluginPanels';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));
jest.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: jest.fn() }));

const Scope = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const SHOW = '00000000-0000-4000-8000-000000000009';

beforeEach(() => {
  jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
  jest
    .mocked(fetchPluginSurface)
    .mockResolvedValue(
      SurfaceSchema.parse({ blocks: [{ type: 'text', text: 'Episode 12 of 28' }] }),
    );
});

describe('PluginPanels', () => {
  it('draws each plugin’s panel about the programme', async () => {
    const drawn = await render(<PluginPanels on="series" subjectId={SHOW} />, { wrapper: Scope });

    expect(await drawn.findByText('Episode 12 of 28')).toBeTruthy();
    expect(drawn.getByText('From AniList')).toBeTruthy();
  });

  it('draws nothing where no plugin adds a panel', async () => {
    jest
      .mocked(fetchPluginContributions)
      .mockResolvedValue(somePluginContributions({ panels: [] }));
    const drawn = await render(<PluginPanels on="title" subjectId={SHOW} />, { wrapper: Scope });

    expect(drawn.toJSON()).toBeNull();
  });
});
