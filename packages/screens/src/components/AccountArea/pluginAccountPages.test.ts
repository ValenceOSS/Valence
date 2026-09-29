import { describe, expect, it } from 'vitest';
import { pluginAccountPages } from './pluginAccountPages';

describe('pluginAccountPages', () => {
  it('lists only the account pages, addressed so they cannot be mistaken for Valence’s own', () => {
    expect(
      pluginAccountPages({
        pages: [
          {
            pluginId: 'anilist',
            pluginName: 'AniList',
            pageId: 'tracking',
            title: 'Anime tracking',
            placement: 'account',
            icon: null,
          },
          {
            pluginId: 'anilist',
            pluginName: 'AniList',
            pageId: 'admin',
            title: 'Sync log',
            placement: 'admin',
            icon: null,
          },
        ],
        panels: [],
        themes: [],
        nodes: [],
      }),
    ).toEqual([
      {
        id: 'plugin.anilist.tracking',
        label: 'Anime tracking',
        pluginId: 'anilist',
        pluginName: 'AniList',
        pageId: 'tracking',
      },
    ]);
  });

  it('has nothing before the contributions are read', () => {
    expect(pluginAccountPages(undefined)).toEqual([]);
  });
});
