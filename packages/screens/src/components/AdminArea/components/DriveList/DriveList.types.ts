import type { Hardware } from '@ValenceContracts/schemas/Hardware';
import type { Monitor } from '@ValenceClient/admin/fetchAdmin';

type DriveListProps = {
  hardware: Hardware;
  activity: Monitor['resources']['drives'];
};

export type { DriveListProps };
