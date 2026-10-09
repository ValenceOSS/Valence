import type { BookFormat } from '@ValenceContracts/schemas/MediaRequest';

type BookFormatChooserProps = {
  value: readonly BookFormat[];
  onChange: (formats: BookFormat[]) => void;
};

export type { BookFormatChooserProps };
