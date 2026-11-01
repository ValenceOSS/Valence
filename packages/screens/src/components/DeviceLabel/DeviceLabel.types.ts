import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { DeviceIdentity } from '@ValenceContracts/schemas/DeviceIdentity';

type DeviceLabelProps = {
  device: string;
  client?: string | null;
  identity?: DeviceIdentity | null;
  clientKind?: ClientKind;
  userAgent?: string | null;
};

export type { DeviceLabelProps };
