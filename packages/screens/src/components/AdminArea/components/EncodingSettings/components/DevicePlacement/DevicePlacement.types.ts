import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';

type DevicePlacementProps = {
  overview: AdminOverview | null;
  devices: PlacedDevice[] | null;
  onSaved?: () => void;
};

export type { DevicePlacementProps };
