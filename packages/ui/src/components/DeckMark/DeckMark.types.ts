type Matrix = readonly [number, number, number, number, number, number];

type Face = { cx: number; apex: number; radius: number; half: number; isSmile: boolean };

type DeckMarkProps = {
  size: number;
  isAnimated?: boolean;
  label?: string;
  className?: string;
};

export type { DeckMarkProps, Face, Matrix };
