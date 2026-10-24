import type { InstalledPlugins } from '@ValenceContracts/schemas/Plugin';

type TrustedKeysCardProps = {
  keys: InstalledPlugins['trustedKeys'];
  onSaved: () => void;
};

export type { TrustedKeysCardProps };
