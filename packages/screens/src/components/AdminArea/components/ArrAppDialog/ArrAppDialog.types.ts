import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';

type ArrAppDialogProps = {
  isOpen: boolean;
  app: ArrApp | null;
  onClose: () => void;
  onSaved: (app: ArrApp) => void;
};

export type { ArrAppDialogProps };
