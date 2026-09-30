import { BUTTON_EXAMPLES } from './BUTTON_EXAMPLES';
import { DATA_EXAMPLES } from './DATA_EXAMPLES';
import { FEEDBACK_EXAMPLES } from './FEEDBACK_EXAMPLES';
import { INPUT_EXAMPLES } from './INPUT_EXAMPLES';
import { LAYOUT_EXAMPLES } from './LAYOUT_EXAMPLES';
import { MEDIA_EXAMPLES } from './MEDIA_EXAMPLES';
import { MENU_EXAMPLES } from './MENU_EXAMPLES';
import { MOTION_EXAMPLES } from './MOTION_EXAMPLES';
import type { UiExampleGroup } from './UiExample.types';

const UI_EXAMPLE_GROUPS: readonly UiExampleGroup[] = [
  { name: 'Buttons', examples: BUTTON_EXAMPLES },
  { name: 'Inputs', examples: INPUT_EXAMPLES },
  { name: 'Menus and dialogs', examples: MENU_EXAMPLES },
  { name: 'Feedback', examples: FEEDBACK_EXAMPLES },
  { name: 'Layout', examples: LAYOUT_EXAMPLES },
  { name: 'Data', examples: DATA_EXAMPLES },
  { name: 'Media', examples: MEDIA_EXAMPLES },
  { name: 'Motion', examples: MOTION_EXAMPLES },
];

export { UI_EXAMPLE_GROUPS };
