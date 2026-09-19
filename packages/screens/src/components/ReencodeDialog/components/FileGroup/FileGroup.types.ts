import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { FileGroup as Group } from '@ValenceScreens/components/ReencodeDialog/groupIntoThings';

type FileGroupProps = {
  group: Group;
  chosen: ReadonlySet<string>;
  refusalFor: (mediaId: string) => string | null;
  onToggle: (items: readonly MediaSummary[], isChosen: boolean) => void;
};

export type { FileGroupProps };
