import {
  Cursor as MoveIcon,
  Eraser as EraserIcon,
  Paintbrush as MarkerIcon,
  Pen as PenIcon,
  PenLine as PencilIcon,
} from '@keyline-icons/react';
import type { SketchTool } from './SketchStudio.types';
import { say } from '@ValenceI18n/say';

const SKETCH_TOOLS: readonly { id: SketchTool; label: string; icon: typeof PenIcon }[] = [
  { id: 'move', label: say('common.move'), icon: MoveIcon },
  { id: 'pen', label: say('screens.sketchStudio.sketchTools.pen'), icon: PenIcon },
  { id: 'pencil', label: say('screens.sketchStudio.sketchTools.pencil'), icon: PencilIcon },
  { id: 'marker', label: say('screens.sketchStudio.sketchTools.marker'), icon: MarkerIcon },
  { id: 'eraser', label: say('screens.sketchStudio.sketchTools.eraser'), icon: EraserIcon },
];

export { SKETCH_TOOLS };
