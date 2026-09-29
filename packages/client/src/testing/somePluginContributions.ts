import { PluginContributionsSchema } from '@ValenceContracts/schemas/Plugin';
import { aPluginTheme } from '@ValenceClient/testing/aPluginTheme';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';

/**
 * What one plugin adds, for tests about drawing plugin pages, panels and themes: an account page, a
 * panel beside a title and one beside a programme, and a dark theme.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns The contributions.
 */
const somePluginContributions = (
  overrides: Partial<PluginContributions> = {},
): PluginContributions =>
  PluginContributionsSchema.parse({
    pages: [
      {
        pluginId: 'anilist',
        pluginName: 'AniList',
        pageId: 'tracking',
        title: 'Anime tracking',
        placement: 'account',
        icon: 'tv',
      },
    ],
    panels: [
      {
        pluginId: 'anilist',
        pluginName: 'AniList',
        panelId: 'progress',
        title: 'On AniList',
        on: 'series',
      },
      { pluginId: 'anilist', pluginName: 'AniList', panelId: 'score', title: 'Score', on: 'title' },
    ],
    themes: [{ ...aPluginTheme(), pluginId: 'night-sky', pluginName: 'Night Sky' }],
    nodes: [],
    ...overrides,
  });

export { somePluginContributions };
