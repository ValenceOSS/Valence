type DoodleName = 'arrowCurl' | 'arrowDown' | 'circle' | 'sparks' | 'underline';

type DoodleProps = {
  of: DoodleName;
  delay?: number;
  className?: string;
};

export type { DoodleName, DoodleProps };
