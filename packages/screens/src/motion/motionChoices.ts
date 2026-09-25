import { say } from '@ValenceI18n/say';

const MOTION_CHOICES = [
  {
    id: 'system',
    get label() {
      return say('screens.motionChoices.system');
    },
  },
  {
    id: 'full',
    get label() {
      return say('screens.motionChoices.full');
    },
  },
  {
    id: 'reduced',
    get label() {
      return say('screens.motionChoices.reduced');
    },
  },
] as const;

export { MOTION_CHOICES };
