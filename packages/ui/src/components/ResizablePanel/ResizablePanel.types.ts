import type { ReactNode } from 'react';

type ResizablePanelProps = {
  label: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  children: ReactNode;
  className?: string;
  onWidthChange?: (width: number) => void;
};

type ResizePhase = 'resting' | 'dragging' | 'settling';

export type { ResizablePanelProps, ResizePhase };
