import type { OrbLook } from '@ValenceUI/orbs/OrbLook';
import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

type OrbProps = {
  variant: OrbVariant;
  look?: OrbLook;
  label?: string;
  isStill?: boolean;
  className?: string;
};

export type { OrbProps };
