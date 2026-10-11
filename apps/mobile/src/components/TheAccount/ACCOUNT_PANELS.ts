import {
  CircleUser as CircleUserFilled,
  EyeOff as EyeOffFilled,
  History as HistoryFilled,
  LaptopSmartphone as LaptopSmartphoneFilled,
  Link as LinkFilled,
  ShieldCheck as ShieldCheckFilled,
} from '@keyline-icons/react-native/fill';
import { say } from '@ValenceI18n/say';

const ACCOUNT_PANELS = [
  { id: 'profile', label: say('common.profile'), icon: CircleUserFilled },
  { id: 'security', label: say('common.security'), icon: ShieldCheckFilled },
  { id: 'devices', label: say('common.devices'), icon: LaptopSmartphoneFilled },
  { id: 'history', label: say('common.history'), icon: HistoryFilled },
  { id: 'hidden', label: say('common.hidden'), icon: EyeOffFilled },
  { id: 'shares', label: say('common.sharedLinks'), icon: LinkFilled },
] as const;

export { ACCOUNT_PANELS };
