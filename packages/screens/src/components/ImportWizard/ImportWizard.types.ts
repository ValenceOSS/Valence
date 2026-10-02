type ImportStepId = 'source' | 'people' | 'libraries' | 'plan' | 'importing' | 'requests' | 'links';

type ImportWizardProps = {
  onFinished?: () => void;
};

export type { ImportStepId, ImportWizardProps };
