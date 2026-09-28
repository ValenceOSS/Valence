import {
  CircleUser as CircleUserFilled,
  Clock as ClockFilled,
  EyeOff as EyeOffFilled,
  Link as LinkFilled,
  ShieldCheck as ShieldCheckFilled,
  Smartphone as SmartphoneFilled,
} from '@keyline-icons/react-native/fill';

const ACCOUNT_PANELS = [
  { id: 'profile', label: 'Profile', icon: CircleUserFilled },
  { id: 'security', label: 'Security', icon: ShieldCheckFilled },
  { id: 'devices', label: 'Devices', icon: SmartphoneFilled },
  { id: 'history', label: 'History', icon: ClockFilled },
  { id: 'hidden', label: 'Hidden', icon: EyeOffFilled },
  { id: 'shares', label: 'Shares', icon: LinkFilled },
] as const;

export { ACCOUNT_PANELS };
