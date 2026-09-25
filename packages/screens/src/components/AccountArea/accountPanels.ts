import type { StringKey } from '@ValenceI18n/StringKey';

const ACCOUNT_PANELS = [
  { id: 'profile', labelKey: 'screens.accountPanels.profile' },
  { id: 'security', labelKey: 'screens.accountPanels.security' },
  { id: 'devices', labelKey: 'screens.accountPanels.devices' },
  { id: 'links', labelKey: 'screens.accountPanels.links' },
  { id: 'history', labelKey: 'screens.accountPanels.history' },
  { id: 'hidden', labelKey: 'screens.accountPanels.hidden' },
] as const satisfies readonly { id: string; labelKey: StringKey }[];

export { ACCOUNT_PANELS };
