type SplashScreenProps = {
  name?: string;
  label?: string;
  isReady?: boolean;
  marksPlace?: string;
  hasMark?: boolean;
  isLeaving?: boolean;
  onIntroDone?: () => void;
  onLeft?: () => void;
};

export type { SplashScreenProps };
