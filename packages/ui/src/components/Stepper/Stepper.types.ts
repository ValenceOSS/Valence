type StepperStep = {
  id: string;
  label: string;
  detail?: string;
};

type StepperShape = 'fits' | 'list' | 'bar';

type StepperProps = {
  label: string;
  steps: readonly StepperStep[];
  current: string;
  shape?: StepperShape;
  className?: string;
};

export type { StepperProps, StepperShape, StepperStep };
