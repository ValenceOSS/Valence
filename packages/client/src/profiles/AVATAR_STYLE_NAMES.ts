import { say } from '@ValenceI18n/say';
import type { AVATAR_STYLES } from '@ValenceContracts/schemas/ViewerProfile';

const AVATAR_STYLE_NAMES: Record<(typeof AVATAR_STYLES)[number], string> = {
  adventurer: say('screens.faceEditor.drawnStudio.adventurer'),
  lorelei: say('screens.faceEditor.drawnStudio.lorelei'),
  notionists: say('screens.faceEditor.drawnStudio.notionists'),
  bottts: say('screens.faceEditor.drawnStudio.bottts'),
  funEmoji: say('screens.faceEditor.drawnStudio.funEmoji'),
  thumbs: say('screens.faceEditor.drawnStudio.thumbs'),
};

export { AVATAR_STYLE_NAMES };
