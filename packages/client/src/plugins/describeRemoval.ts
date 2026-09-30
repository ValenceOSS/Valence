import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { PluginRemoval } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Says, a line each, what removing a plugin takes with it, leaving out anything it never had.
 *
 * @param removal - What goes with it.
 * @returns The lines, most important first; empty when it kept and added nothing.
 */
const describeRemoval = (removal: PluginRemoval): string[] => [
  ...(removal.bytesKept > 0
    ? [
        say('client.plugins.describeRemoval.bytesKeptItKeptIsDeleted', {
          bytesKept: formatBytes(removal.bytesKept),
        }),
      ]
    : []),
  ...removal.accounts.map((account) =>
    sayCount(
      account.isRevoked
        ? 'client.plugins.describeRemoval.accountsForgottenAndRevoked'
        : 'client.plugins.describeRemoval.accountsForgotten',
      account.connected,
      { provider: account.provider },
    ),
  ),
  ...(removal.people > 0 && removal.accounts.length === 0
    ? [sayCount('client.plugins.describeRemoval.peopleLoseWhatTheyHad', removal.people)]
    : []),
  ...(removal.nodes > 0
    ? [sayCount('client.plugins.describeRemoval.rolesLoseThePermissions', removal.nodes)]
    : []),
  ...(removal.webhooks > 0
    ? [sayCount('client.plugins.describeRemoval.itsWebhookAddressesStopWorkingA', removal.webhooks)]
    : []),
  ...(removal.themes > 0
    ? [sayCount('client.plugins.describeRemoval.anyoneUsingItsThemesGoesBack', removal.themes)]
    : []),
  ...(removal.keepsEarlierVersion
    ? [say('client.plugins.describeRemoval.theEarlierVersionKeptForRolling')]
    : []),
];

export { describeRemoval };
