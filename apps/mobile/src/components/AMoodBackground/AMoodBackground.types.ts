type ALight = {
  colour: string;
  at: string;
};

type AMoodBackgroundProps = {
  lights?: readonly string[];
  palette?: readonly ALight[];
};

export type { ALight, AMoodBackgroundProps };
