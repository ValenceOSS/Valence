import { say } from '@ValenceI18n/say';

const FACE_MODES = [
  { id: 'orb', label: say('common.orb') },
  { id: 'photo', label: say('screens.faceEditor.faceModes.photo') },
  { id: 'sketch', label: say('screens.faceEditor.faceModes.draw') },
  { id: 'drawn', label: say('screens.faceEditor.faceModes.avatar') },
  { id: 'initial', label: say('screens.faceEditor.faceModes.letter') },
] as const;

export { FACE_MODES };
