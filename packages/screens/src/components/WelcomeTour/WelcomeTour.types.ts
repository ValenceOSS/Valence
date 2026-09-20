import type { Place } from '@ValenceClient/navigation/readLocation';

type WelcomeTourProps = {
  isOpen: boolean;
  name: string;
  onGoTo: (section: Place['section']) => void;
  onFinished: () => void;
};

export type { WelcomeTourProps };
