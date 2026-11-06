type EngineReading = {
  render: number | null;
  copy: number | null;
  video: number | null;
  videoEnhance: number | null;
  memoryBytes: number | null;
};

type EngineGraphsProps = {
  history: readonly EngineReading[];
};

export type { EngineGraphsProps, EngineReading };
