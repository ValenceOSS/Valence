type GradientAsciiShape = 'horizon' | 'pinch' | 'rise' | 'eclipse';

type GradientAsciiLook = {
  colours: readonly string[];
  shape: GradientAsciiShape;
  characters: string;
  cellSize: number;
  density: number;
  glyphOpacity: number;
  glow: number;
  flicker: number;
  softness: number;
  flow: number;
  speed: number;
  gradientOpacity: number;
  grain: number;
  fontFamily: string;
  isStill: boolean;
  isInteractive: boolean;
};

type GradientAsciiProps = Partial<Omit<GradientAsciiLook, 'isStill'>> & {
  className?: string;
};

export type { GradientAsciiLook, GradientAsciiProps, GradientAsciiShape };
