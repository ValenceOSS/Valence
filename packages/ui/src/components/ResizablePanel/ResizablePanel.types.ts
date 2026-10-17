import type { ReactNode } from 'react';

type ResizablePanelProps = {
  label: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  edge?: 'start' | 'end';
  isDisabled?: boolean;
  children: ReactNode;
  className?: string;
  onWidthChange?: (width: number) => void;
};

type ResizePhase = 'resting' | 'dragging' | 'settling';

export type { ResizablePanelProps, ResizePhase };
