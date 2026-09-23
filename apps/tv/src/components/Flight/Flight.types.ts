import type { ReactNode } from 'react';

type Spot = { x: number; y: number; width: number; height: number };

type FlightProps = {
  from: Spot;
  to: Spot | null;
  onLanded: () => void;
  children: ReactNode;
};

type Leaving = { face: Spot | null; mark: Spot | null };

export type { FlightProps, Leaving, Spot };
