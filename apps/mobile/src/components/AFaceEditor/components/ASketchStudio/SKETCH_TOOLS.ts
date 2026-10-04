import { Cursor, Eraser, Paintbrush, Pen, PenLine } from '@keyline-icons/react-native';
import type { ASketchTool } from '@ValenceMobile/components/ASketchPad/ASketchPad.types';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import { say } from '@ValenceI18n/say';

const SKETCH_TOOLS: readonly { id: ASketchTool; label: string; icon: AGlyph }[] = [
  { id: 'pen', label: say('screens.sketchStudio.sketchTools.pen'), icon: Pen },
  { id: 'pencil', label: say('screens.sketchStudio.sketchTools.pencil'), icon: PenLine },
  { id: 'marker', label: say('screens.sketchStudio.sketchTools.marker'), icon: Paintbrush },
  { id: 'eraser', label: say('screens.sketchStudio.sketchTools.eraser'), icon: Eraser },
  { id: 'move', label: say('common.move'), icon: Cursor },
];

export { SKETCH_TOOLS };
