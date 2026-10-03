import {
  CircleUser as CircleUserFilled,
  Clock as ClockFilled,
  EyeOff as EyeOffFilled,
  Link as LinkFilled,
  ShieldCheck as ShieldCheckFilled,
  Smartphone as SmartphoneFilled,
} from '@keyline-icons/react-native/fill';
import { say } from '@ValenceI18n/say';

const ACCOUNT_PANELS = [
  { id: 'profile', label: say('common.profile'), icon: CircleUserFilled },
  { id: 'security', label: say('common.security'), icon: ShieldCheckFilled },
  { id: 'devices', label: say('common.devices'), icon: SmartphoneFilled },
  { id: 'history', label: say('common.history'), icon: ClockFilled },
  { id: 'hidden', label: say('common.hidden'), icon: EyeOffFilled },
  { id: 'shares', label: say('common.sharedLinks'), icon: LinkFilled },
] as const;

export { ACCOUNT_PANELS };
