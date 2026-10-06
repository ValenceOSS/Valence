type DoodleName = 'arrowCurl' | 'arrowDown' | 'circle' | 'sparks' | 'underline';

type DoodleProps = {
  of: DoodleName;
  delay?: number;
  isShown?: boolean;
  className?: string;
};

export type { DoodleName, DoodleProps };
