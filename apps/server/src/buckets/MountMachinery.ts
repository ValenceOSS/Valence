type MountProcess = {
  onExit: (listener: (said: string) => void) => void;
  stop: () => void;
};

type MountMachinery = {
  hasFuse: () => Promise<boolean>;
  run: (
    args: string[],
    env: Record<string, string>,
    withinMs: number,
  ) => Promise<{ ok: boolean; out: string; said: string }>;
  start: (args: string[], env: Record<string, string>) => MountProcess;
  prepare: (target: string, cacheDirectory: string) => Promise<void>;
  release: (target: string) => Promise<void>;
  isMounted: (target: string) => Promise<boolean>;
};

export type { MountMachinery, MountProcess };
