const PREFIX = 'plugin:';

/**
 * Which plugin page an account tab stands for, where it stands for one. A plugin page's tab is named
 * `plugin:` followed by the plugin and the page, so it can never be mistaken for one of Valence's
 * own tabs.
 *
 * @param tab - The tab's id.
 * @returns The plugin and its page, or nothing for one of Valence's own tabs.
 */
const pluginPageOf = (tab: string): { pluginId: string; pageId: string } | null => {
  if (!tab.startsWith(PREFIX)) {
    return null;
  }

  const [pluginId, pageId, ...rest] = tab.slice(PREFIX.length).split(':');

  return pluginId === undefined ||
    pageId === undefined ||
    pluginId === '' ||
    pageId === '' ||
    rest.length > 0
    ? null
    : { pluginId, pageId };
};

export { pluginPageOf };
