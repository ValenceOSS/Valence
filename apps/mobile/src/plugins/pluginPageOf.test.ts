import { pluginPageOf } from './pluginPageOf';

describe('pluginPageOf', () => {
  it('reads the plugin and the page from a plugin tab', () => {
    expect(pluginPageOf('plugin:anilist:tracking')).toEqual({
      pluginId: 'anilist',
      pageId: 'tracking',
    });
  });

  it('says a tab of Valence’s own is no plugin page', () => {
    expect(pluginPageOf('profile')).toBeNull();
  });

  it('refuses a plugin tab missing its page, or with too much in it', () => {
    expect(pluginPageOf('plugin:anilist')).toBeNull();
    expect(pluginPageOf('plugin::tracking')).toBeNull();
    expect(pluginPageOf('plugin:anilist:tracking:more')).toBeNull();
  });
});
