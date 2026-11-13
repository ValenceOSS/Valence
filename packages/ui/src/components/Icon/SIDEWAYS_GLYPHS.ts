import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from '@keyline-icons/react';
import {
  ArrowLeft as ArrowLeftFilled,
  ArrowRight as ArrowRightFilled,
  ChevronLeft as ChevronLeftFilled,
  ChevronRight as ChevronRightFilled,
} from '@keyline-icons/react/fill';
import type { IconGlyph } from '@ValenceUI/Icon.types';

const SIDEWAYS_GLYPHS: ReadonlySet<IconGlyph> = new Set<IconGlyph>([
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeftFilled,
  ArrowRightFilled,
  ChevronLeftFilled,
  ChevronRightFilled,
]);

export { SIDEWAYS_GLYPHS };
