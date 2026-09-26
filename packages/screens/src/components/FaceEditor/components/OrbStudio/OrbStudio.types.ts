import type { OrbLook } from '@ValenceUI/orbs/OrbLook';

type OrbChoice = OrbLook & { orb: string };

type OrbStudioProps = {
  value: OrbChoice;
  onChange: (next: OrbChoice) => void;
};

export type { OrbChoice, OrbStudioProps };
