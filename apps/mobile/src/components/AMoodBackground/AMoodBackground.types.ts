type ALight = {
  colour: string;
  at: string;
  weight?: number;
};

type AMoodBackgroundProps = {
  lights?: readonly string[];
  palette?: readonly ALight[];
  ground?: string;
  veil?: string;
};

export type { ALight, AMoodBackgroundProps };
