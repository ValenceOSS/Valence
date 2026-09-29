/**
 * Where on the server something about one plugin lives, with every part of it escaped so a plugin
 * or page id can only ever name a place and never change which one.
 *
 * @param pluginId - The plugin.
 * @param rest - What of the plugin's, in order: `pages`, a page id, `act` and so on.
 * @returns The path.
 */
const pluginPath = (pluginId: string, ...rest: readonly string[]): string =>
  ['/api/plugins', pluginId, ...rest]
    .map((part, at) => (at === 0 ? part : encodeURIComponent(part)))
    .join('/');

export { pluginPath };
