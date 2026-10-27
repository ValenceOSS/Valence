import type { DownloadClientPlugin } from '@ValenceContracts/schemas/DownloadClient';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';

type NamesAPlugin = { plugin?: DownloadClientPlugin | null | undefined };

/**
 * Checks a download client an administrator is saving against the download clients plugins
 * offer, and takes its protocol from what the plugin declared rather than from what was sent.
 *
 * @param body - The client, or a change to one.
 * @param offered - The download clients turned-on plugins offer.
 * @returns The client with the plugin's own protocol, the client unchanged where it names no
 *   plugin, or null where no plugin offers what it names.
 */
const withOfferedProtocol = <Body extends NamesAPlugin>(
  body: Body,
  offered: PluginContributions['downloadClients'],
): Body | null => {
  const named = body.plugin;

  if (named === undefined || named === null) {
    return body;
  }

  const found = offered.find(
    (each) => each.pluginId === named.id && each.clientId === named.clientId,
  );

  return found === undefined ? null : { ...body, plugin: { ...named, protocol: found.protocol } };
};

export { withOfferedProtocol };
