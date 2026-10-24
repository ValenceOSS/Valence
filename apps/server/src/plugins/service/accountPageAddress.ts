/**
 * Where a plugin's page in somebody's account area opens.
 *
 * @param pluginId - The plugin.
 * @param pageId - Its page.
 * @returns The address.
 */
const accountPageAddress = (pluginId: string, pageId: string): string =>
  `/?account=${encodeURIComponent(`plugin.${pluginId}.${pageId}`)}`;

export { accountPageAddress };
