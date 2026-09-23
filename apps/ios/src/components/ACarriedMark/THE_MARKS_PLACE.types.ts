import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';

type AFlyer = {
  leave: (at: ARectOnScreen) => void;
  land: (at: ARectOnScreen, whenThere: () => void) => boolean;
};

type TheMarksWay = AFlyer & {
  hasShown: () => boolean;
  markShown: () => void;
  flyWith: (flyer: AFlyer | null) => void;
};

export type { AFlyer, TheMarksWay };
