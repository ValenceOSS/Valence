import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginPageDialog } from './PluginPageDialog';

const fetchPluginSurface = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface }));

describe('PluginPageDialog', () => {
  it('raises a plugin’s administrator page', async () => {
    fetchPluginSurface.mockResolvedValue({ blocks: [{ type: 'text', text: '42 titles matched' }] });

    renderInAnAddress(
      <PluginPageDialog
        page={{ pluginId: 'anilist', pageId: 'log', title: 'Sync log' }}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText('42 titles matched')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sync log' })).toBeInTheDocument();
  });
});
