const theGlyphsToDraw = [
  'Captions',
  'Check',
  'ChevronLeft',
  'Pause',
  'Play',
  'RotateCcw',
  'RotateCw',
  'Settings',
  'X',
] as const;

type GlyphName = (typeof theGlyphsToDraw)[number];

export type { GlyphName };

export { theGlyphsToDraw };
