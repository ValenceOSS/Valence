import type { UiComponentDoc } from 'virtual:ui-catalogue';
import type { UiExample } from '@ValenceLanding/components/UiLibraryPage/examples/UiExample.types';

type UiComponentViewProps = {
  doc: UiComponentDoc;
  group: string;
  examples: readonly UiExample[];
};

export type { UiComponentViewProps };
