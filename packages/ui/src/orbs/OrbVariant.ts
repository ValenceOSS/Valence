type OrbParam = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  standard: number;
  isRate?: boolean;
};

type OrbColour = { key: string; label: string; standard: string };

type OrbVariant = {
  key: string;
  label: string;
  shader: string;
  params: readonly OrbParam[];
  colours: readonly OrbColour[];
};

export type { OrbColour, OrbParam, OrbVariant };
