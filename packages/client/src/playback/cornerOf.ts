const COLUMN_OF = ['left', 'centre', 'right'] as const;

const ROW_OF = ['bottom', 'middle', 'top'] as const;

type CueColumn = (typeof COLUMN_OF)[number];

type CueCorner = {
  across: CueColumn;
  down: (typeof ROW_OF)[number];
};

/**
 * Reads a keypad alignment as the corner it anchors to, taking anything outside the nine as the
 * nearest of them rather than placing a line nowhere.
 *
 * @param alignment - The keypad position, 1 to 9.
 * @returns Which third of the picture it sits in, across and down.
 */
const cornerOf = (alignment: number): CueCorner => {
  const index = Math.min(Math.max(Math.round(alignment), 1), 9) - 1;

  return {
    across: COLUMN_OF[index % 3] ?? 'centre',
    down: ROW_OF[Math.floor(index / 3)] ?? 'bottom',
  };
};

export type { CueColumn, CueCorner };

export { cornerOf };
