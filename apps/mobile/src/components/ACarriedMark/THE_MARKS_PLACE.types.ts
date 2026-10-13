import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';

type AFlyer = {
  leave: (at: ARectOnScreen) => void;
  land: (at: ARectOnScreen, whenThere: () => void) => boolean;
};

type TheMarksWay = AFlyer & {
  hasShown: () => boolean;
  markShown: () => void;
  flyWith: (flyer: AFlyer | null) => void;
  hold: () => void;
  release: (from: ARectOnScreen) => void;
};

export type { AFlyer, TheMarksWay };
