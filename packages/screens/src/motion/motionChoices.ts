import { say } from '@ValenceI18n/say';

const MOTION_CHOICES = [
  { id: 'system', label: say('common.system') },
  { id: 'full', label: say('screens.motion.motionChoices.full') },
  { id: 'reduced', label: say('screens.motion.motionChoices.reduced') },
] as const;

export { MOTION_CHOICES };
