import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginPanels } from './PluginPanels';

const fetchPluginContributions = vi.hoisted(() => vi.fn());
const fetchPluginSurface = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({ fetchPluginContributions }));
vi.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface }));

beforeEach(() => {
  fetchPluginContributions.mockReset().mockResolvedValue({
    pages: [],
    panels: [
      {
        pluginId: 'anilist',
        pluginName: 'AniList',
        panelId: 'score',
        title: 'On AniList',
        on: 'series',
      },
      { pluginId: 'lyrics', pluginName: 'Lyrics', panelId: 'words', title: 'Words', on: 'album' },
    ],
    themes: [],
  });
  fetchPluginSurface
    .mockReset()
    .mockResolvedValue({ blocks: [{ type: 'text', text: 'Score 8.9' }] });
});

describe('PluginPanels', () => {
  it('draws the panels meant for this kind of page, under the plugin’s name', async () => {
    renderInAnAddress(<PluginPanels on="series" subjectId="s1" />);

    expect(await screen.findByText('Score 8.9')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'On AniList' })).toBeInTheDocument();
    expect(screen.getByText('AniList')).toBeInTheDocument();
    expect(screen.queryByText('Words')).not.toBeInTheDocument();
    expect(fetchPluginSurface).toHaveBeenCalledWith({
      kind: 'panel',
      pluginId: 'anilist',
      panelId: 'score',
      on: 'series',
      subjectId: 's1',
    });
  });

  it('draws nothing where no plugin adds anything here', async () => {
    const { container } = renderInAnAddress(<PluginPanels on="playlist" subjectId="p1" />);

    await vi.waitFor(
      () => {
        expect(fetchPluginContributions).toHaveBeenCalled();
      },
      { timeout: 5_000 },
    );

    expect(container.querySelector('section')).toBeNull();
  });
});
