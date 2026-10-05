type CursorStop = {
  at: number;
  x: number;
  y: number;
  isPressing?: boolean;
  holdsUntil?: number;
};

type SceneCursorProps = {
  path: readonly CursorStop[];
  look?: 'pointer' | 'drag';
};

export type { CursorStop, SceneCursorProps };
