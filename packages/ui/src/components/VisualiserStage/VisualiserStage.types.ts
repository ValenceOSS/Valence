type VisualiserStageProps = {
  draw: (
    context: CanvasRenderingContext2D,
    size: { width: number; height: number },
    time: { seconds: number; delta: number },
  ) => void;
  className?: string;
};

export type { VisualiserStageProps };
