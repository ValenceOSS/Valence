import type { AuditCategory } from '@ValenceContracts/schemas/Audit';
import { say } from '@ValenceI18n/say';

const AUDIT_CATEGORY_NAMES: Readonly<Record<AuditCategory, string>> = {
  auth: say('screens.admin.auditCategoryNames.auth'),
  account: say('common.accounts'),
  profile: say('common.profiles'),
  role: say('common.roles'),
  library: say('common.libraries'),
  media: say('screens.adminArea.cataloguePanel.titles'),
  files: say('common.files'),
  request: say('common.requests'),
  share: say('common.sharedLinks'),
  stream: say('screens.admin.auditCategoryNames.stream'),
  job: say('common.jobs'),
  settings: say('common.settings'),
  plugin: say('common.plugins'),
  webhook: say('common.webhooks'),
  backup: say('screens.adminArea.adminSections.backups'),
};

export { AUDIT_CATEGORY_NAMES };
