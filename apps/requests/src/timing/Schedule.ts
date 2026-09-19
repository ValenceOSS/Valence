type Schedule = (run: () => void, afterMs: number) => () => void;

export type { Schedule };
