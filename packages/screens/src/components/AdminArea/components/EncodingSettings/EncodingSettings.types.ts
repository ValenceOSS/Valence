import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';

type EncodingSettingsProps = {
  overview: AdminOverview | null;
  devices: PlacedDevice[] | null;
};

export type { EncodingSettingsProps };
