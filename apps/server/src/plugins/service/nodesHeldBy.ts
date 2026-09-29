import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';

/**
 * Which of a plugin's own permission nodes somebody holds: every one for an administrator, and
 * otherwise those a role of theirs was given.
 *
 * @param manifest - The plugin, with the nodes it declares.
 * @param grants - Everything they may do.
 * @returns The ids of the nodes they hold, as the plugin names them.
 */
const nodesHeldBy = (
  manifest: Pick<PluginManifest, 'id' | 'contributes'>,
  grants: ReadonlySet<GrantedPermission>,
): string[] =>
  manifest.contributes.nodes
    .filter((node) => grants.has(ADMINISTRATOR) || grants.has(`plugin.${manifest.id}.${node.id}`))
    .map((node) => node.id);

export { nodesHeldBy };
