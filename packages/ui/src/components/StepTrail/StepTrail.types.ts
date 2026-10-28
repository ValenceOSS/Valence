import type { ReactNode } from 'react';
import type { BadgeTone } from '@ValenceUI/Badge.types';

type StepTrailMarkKind = 'done' | 'current' | 'failed' | 'waiting' | 'locked';

type StepTrailLineMark = 'quiet' | 'current' | 'failed';

type StepTrailStateTone = 'accent' | 'warning' | 'danger';

type StepTrailLine = {
  id: string;
  mark: StepTrailLineMark;
  content: ReactNode;
};

type StepTrailAside =
  | { kind: 'note'; text: string }
  | { kind: 'state'; text: string; tone: StepTrailStateTone }
  | { kind: 'badge'; text: string; tone: BadgeTone };

type StepTrailStep = {
  id: string;
  label: string;
  mark: StepTrailMarkKind;
  aside?: StepTrailAside | undefined;
  lines?: readonly StepTrailLine[];
  isOpenAtFirst?: boolean;
};

type StepTrailProps = {
  label: string;
  steps: readonly StepTrailStep[];
  className?: string;
};

export type {
  StepTrailAside,
  StepTrailLine,
  StepTrailLineMark,
  StepTrailMarkKind,
  StepTrailProps,
  StepTrailStateTone,
  StepTrailStep,
};
