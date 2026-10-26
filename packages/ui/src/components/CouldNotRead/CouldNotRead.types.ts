type CouldNotReadProps = {
  said: string;
  why?: string | null;
  onTryAgain: () => void;
  isTryingAgain?: boolean;
  className?: string;
};

export type { CouldNotReadProps };
