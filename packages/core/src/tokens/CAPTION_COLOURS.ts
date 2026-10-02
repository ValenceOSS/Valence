import { say } from '@ValenceI18n/say';

const CAPTION_COLOURS = [
  { id: '#ffffff', label: say('common.white') },
  { id: '#ffff00', label: say('common.yellow') },
  { id: '#00ff00', label: say('common.green') },
  { id: '#00ffff', label: say('ui.tokens.captionColours.cyan') },
  { id: '#ff0000', label: say('common.red') },
  { id: '#000000', label: say('ui.tokens.captionColours.black') },
] as const;

export { CAPTION_COLOURS };
