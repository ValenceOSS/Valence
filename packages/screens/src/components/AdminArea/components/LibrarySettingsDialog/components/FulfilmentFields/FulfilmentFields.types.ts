import type { ArrApp, FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { FulfilmentForm } from '@ValenceScreens/components/AdminArea/components/LibrarySettingsDialog/readFulfilmentForm';

type FulfilmentFieldsProps = {
  kind: FulfillingArrAppKind;
  apps: readonly ArrApp[];
  form: FulfilmentForm;
  onChange: (next: Partial<FulfilmentForm>) => void;
};

export type { FulfilmentFieldsProps };
