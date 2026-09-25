import { say } from '@ValenceI18n/say';

const CAPTION_COLOURS = [
  {
    id: '#ffffff',
    get label() {
      return say('ui.captionColours.white');
    },
  },
  {
    id: '#ffff00',
    get label() {
      return say('ui.captionColours.yellow');
    },
  },
  {
    id: '#00ff00',
    get label() {
      return say('ui.captionColours.green');
    },
  },
  {
    id: '#00ffff',
    get label() {
      return say('ui.captionColours.cyan');
    },
  },
  {
    id: '#ff0000',
    get label() {
      return say('ui.captionColours.red');
    },
  },
  {
    id: '#000000',
    get label() {
      return say('ui.captionColours.black');
    },
  },
] as const;

export { CAPTION_COLOURS };
