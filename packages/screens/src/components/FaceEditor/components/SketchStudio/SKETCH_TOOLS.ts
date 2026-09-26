import {
  Cursor as MoveIcon,
  Eraser as EraserIcon,
  Paintbrush as MarkerIcon,
  Pen as PenIcon,
  PenLine as PencilIcon,
} from '@keyline-icons/react';
import type { SketchTool } from './SketchStudio.types';

const SKETCH_TOOLS: readonly { id: SketchTool; label: string; icon: typeof PenIcon }[] = [
  { id: 'move', label: 'Move', icon: MoveIcon },
  { id: 'pen', label: 'Pen', icon: PenIcon },
  { id: 'pencil', label: 'Pencil', icon: PencilIcon },
  { id: 'marker', label: 'Marker', icon: MarkerIcon },
  { id: 'eraser', label: 'Eraser', icon: EraserIcon },
];

export { SKETCH_TOOLS };
