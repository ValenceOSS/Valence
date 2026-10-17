import type { AuditAction } from '@ValenceContracts/schemas/Audit';
import { say } from '@ValenceI18n/say';

const AUDIT_ACTION_NAMES: Readonly<Record<AuditAction, string>> = {
  'account.created': say('screens.admin.auditActionNames.accountCreated'),
  'account.removed': say('screens.admin.auditActionNames.accountRemoved'),
  'account.rolesChanged': say('screens.admin.auditActionNames.accountRolesChanged'),
  'account.passwordReset': say('screens.adminArea.emailCard.recentEmails.passwordReset'),
  'account.signedOutEverywhere': say('screens.admin.auditActionNames.accountSignedOutEverywhere'),
  'account.sessionEnded': say('screens.admin.auditActionNames.accountSessionEnded'),
  'account.banned': say('screens.admin.auditActionNames.accountBanned'),
  'account.unbanned': say('screens.admin.auditActionNames.accountUnbanned'),
  'account.changed': say('screens.admin.auditActionNames.accountChanged'),
  'role.created': say('screens.admin.auditActionNames.roleCreated'),
  'role.changed': say('contracts.schemas.webhook.roleChanged'),
  'role.removed': say('screens.admin.auditActionNames.roleRemoved'),
  'share.withdrawn': say('screens.admin.auditActionNames.shareWithdrawn'),
  'files.removed': say('screens.admin.auditActionNames.filesRemoved'),
  'files.moved': say('screens.admin.auditActionNames.filesMoved'),
  'files.renamed': say('screens.admin.auditActionNames.filesRenamed'),
  'media.removed': say('screens.admin.auditActionNames.mediaRemoved'),
  'settings.changed': say('screens.admin.auditActionNames.settingsChanged'),
  'library.added': say('screens.admin.auditActionNames.libraryAdded'),
  'library.changed': say('screens.admin.auditActionNames.libraryChanged'),
  'library.removed': say('screens.admin.auditActionNames.libraryRemoved'),
  'library.reset': say('screens.admin.auditActionNames.libraryReset'),
  'plugin.installed': say('screens.admin.auditActionNames.pluginInstalled'),
  'plugin.changed': say('screens.admin.auditActionNames.pluginChanged'),
  'plugin.removed': say('screens.admin.auditActionNames.pluginRemoved'),
  'webhook.added': say('screens.admin.auditActionNames.webhookAdded'),
  'webhook.changed': say('screens.admin.auditActionNames.webhookChanged'),
  'webhook.removed': say('screens.admin.auditActionNames.webhookRemoved'),
  'backup.taken': say('screens.admin.auditActionNames.backupTaken'),
  'backup.removed': say('screens.admin.auditActionNames.backupRemoved'),
};

export { AUDIT_ACTION_NAMES };
