type ALight = {
  colour: string;
  at: string;
};

type AMoodBackgroundProps = {
  lights?: readonly string[];
  palette?: readonly ALight[];
  ground?: string;
  veil?: string;
};

export type { ALight, AMoodBackgroundProps };
