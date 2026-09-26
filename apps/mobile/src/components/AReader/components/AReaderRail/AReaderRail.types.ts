import type { ARailTuning } from './ARailTuning';

type AReaderRailProps = {
  breadth: number;
  freeFrom: number;
  below: number;
  side: 'left' | 'right';
  centreIn: number;
  pictures: readonly string[];
  page: number;
  ink: string;
  tuning: ARailTuning;
  onPage: (page: number) => void;
  onBack: () => void;
  onPanel: () => void;
  onReadOn: (() => void) | null;
};

export type { AReaderRailProps };
