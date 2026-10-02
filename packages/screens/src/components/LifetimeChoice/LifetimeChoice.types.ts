import type { SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';

type LifetimeChoiceProps = {
  value: SetupLinkLifetime;
  onChoose: (lifetime: SetupLinkLifetime) => void;
};

export type { LifetimeChoiceProps };
