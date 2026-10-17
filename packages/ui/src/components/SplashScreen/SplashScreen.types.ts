type SplashFailure = {
  title: string;
  detail: string;
};

type SplashScreenProps = {
  name?: string;
  label?: string;
  isReady?: boolean;
  failure?: SplashFailure | null;
  onTryAgain?: () => void;
  isTryingAgain?: boolean;
  marksPlace?: string;
  hasMark?: boolean;
  isLeaving?: boolean;
  onIntroDone?: () => void;
  onLeft?: () => void;
};

export type { SplashFailure, SplashScreenProps };
