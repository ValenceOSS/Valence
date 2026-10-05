import { say } from '@ValenceI18n/say';

const FACE_MODES = [
  { id: 'photo', label: say('screens.faceEditor.faceModes.photo') },
  { id: 'drawn', label: say('screens.faceEditor.faceModes.avatar') },
  { id: 'initial', label: say('screens.faceEditor.faceModes.letter') },
] as const;

export { FACE_MODES };
