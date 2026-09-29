import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { PluginRemoval } from '@ValenceContracts/schemas/Plugin';

const counted = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

/**
 * Says, a line each, what removing a plugin takes with it, leaving out anything it never had.
 *
 * @param removal - What goes with it.
 * @returns The lines, most important first; empty when it kept and added nothing.
 */
const describeRemoval = (removal: PluginRemoval): string[] => [
  ...(removal.bytesKept > 0 ? [`${formatBytes(removal.bytesKept)} it kept is deleted.`] : []),
  ...removal.accounts.map(
    (account) =>
      `${counted(account.connected, 'account', 'accounts')} connected to ${account.provider} ${
        account.connected === 1 ? 'is' : 'are'
      } forgotten${account.isRevoked ? `, and ${account.provider} is asked to cancel access` : ''}.`,
  ),
  ...(removal.people > 0 && removal.accounts.length === 0
    ? [
        `${counted(removal.people, 'person', 'people')} ${removal.people === 1 ? 'loses' : 'lose'} what they had in it.`,
      ]
    : []),
  ...(removal.nodes > 0
    ? [
        `Roles lose the ${counted(removal.nodes, 'permission', 'permissions')} it added, and adding it again does not bring them back.`,
      ]
    : []),
  ...(removal.webhooks > 0
    ? [
        `Its webhook ${removal.webhooks === 1 ? 'address stops' : 'addresses stop'} working; a new install gets new ones.`,
      ]
    : []),
  ...(removal.themes > 0
    ? [
        `Anyone using its ${removal.themes === 1 ? 'theme' : 'themes'} goes back to Valence’s own colours.`,
      ]
    : []),
  ...(removal.keepsEarlierVersion ? ['The earlier version kept for rolling back goes too.'] : []),
];

export { describeRemoval };
