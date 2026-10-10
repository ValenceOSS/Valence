import { say } from '@ValenceI18n/say';
import type { AdminPanelId } from './adminSections';

const ADMIN_COMMANDS = [
  { id: 'addLibrary', panel: 'libraries', label: say('common.addLibrary') },
  {
    id: 'reEncode',
    panel: 'encoding',
    label: say('screens.adminArea.encodingPanel.reEncodeSomething'),
  },
  {
    id: 'makeNextCopy',
    panel: 'encoding',
    label: say('screens.adminArea.preTranscodingCard.makeTheNextCopyNow'),
  },
  { id: 'addAccount', panel: 'accounts', label: say('screens.addAccountDialog.addAnAccount') },
  { id: 'createRole', panel: 'roles', label: say('screens.adminArea.rolesPanel.createRole') },
  {
    id: 'checkRequests',
    panel: 'requests',
    label: say('screens.adminArea.requestsPanel.checkNow'),
  },
  {
    id: 'connectApp',
    panel: 'requests',
    label: say('screens.adminArea.arrAppDialog.connectAnApp'),
  },
  {
    id: 'bringInASetup',
    panel: 'requests',
    label: say('screens.adminArea.arrAppsPanel.bringInASetup'),
  },
  { id: 'addTitle', panel: 'catalogue', label: say('screens.adminArea.cataloguePanel.addATitle') },
  { id: 'followAll', panel: 'catalogue', label: say('screens.adminArea.cataloguePanel.followAll') },
  {
    id: 'searchAllMissing',
    panel: 'catalogue',
    label: say('screens.adminArea.cataloguePanel.searchAllMissing'),
  },
  { id: 'addIndexer', panel: 'indexers', label: say('common.addAnIndexer') },
  {
    id: 'testAllIndexers',
    panel: 'indexers',
    label: say('screens.adminArea.indexersPanel.testAll'),
  },
  {
    id: 'importFromProwlarr',
    panel: 'indexers',
    label: say('screens.adminArea.indexersPanel.importFromProwlarr'),
  },
  { id: 'addProfile', panel: 'profiles', label: say('common.addMediaProfile') },
  { id: 'addDownloadClient', panel: 'downloads', label: say('common.addADownloadClient') },
  { id: 'createWebhook', panel: 'webhooks', label: say('common.createWebhook') },
  {
    id: 'makeInvite',
    panel: 'linking',
    label: say('screens.adminArea.linkedServersPanel.makeAnInvite'),
  },
] as const satisfies readonly { id: string; panel: AdminPanelId; label: string }[];

type AdminCommandId = (typeof ADMIN_COMMANDS)[number]['id'];

export type { AdminCommandId };

export { ADMIN_COMMANDS };
