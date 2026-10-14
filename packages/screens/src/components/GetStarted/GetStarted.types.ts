type GetStartedStepStatus = 'open' | 'done' | 'skipped';

type GetStartedStep = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  status: GetStartedStepStatus;
  onAction: () => void;
};

type GetStartedSection = {
  id: string;
  title: string;
  steps: GetStartedStep[];
};

type GetStartedProps = {
  title: string;
  sections: GetStartedSection[];
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  onSkip: (stepId: string) => void;
  onSkipAll: () => void;
};

export type { GetStartedProps, GetStartedSection, GetStartedStep, GetStartedStepStatus };
