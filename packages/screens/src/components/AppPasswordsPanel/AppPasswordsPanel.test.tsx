import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AppPasswordsPanel } from './AppPasswordsPanel';
import type { AppPasswords } from '@ValenceContracts/schemas/Plugin';

const fetchAppPasswords = vi.fn<(pluginId: string) => Promise<AppPasswords>>();

vi.mock('@ValenceClient/plugins/fetchAppPasswords', () => ({
  fetchAppPasswords: (pluginId: string) => fetchAppPasswords(pluginId),
}));

beforeEach(() => {
  fetchAppPasswords.mockReset().mockResolvedValue({
    address: 'https://valence.test/api/plugins/x/routes',
    routes: [],
    passwords: [],
  });
});

describe('AppPasswordsPanel', () => {
  it('gives each plugin that takes app passwords a part of its own', async () => {
    renderInAnAddress(
      <AppPasswordsPanel
        plugins={[
          { pluginId: 'music', pluginName: 'Music apps' },
          { pluginId: 'books', pluginName: 'Book readers' },
        ]}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Music apps' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Book readers' })).toBeInTheDocument();
    expect(fetchAppPasswords).toHaveBeenCalledWith('music');
    expect(fetchAppPasswords).toHaveBeenCalledWith('books');
  });
});
