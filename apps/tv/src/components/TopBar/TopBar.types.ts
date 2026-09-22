import type { UpTarget } from '@ValenceTv/components/SystemSearch/SystemSearch.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { Tab } from '@ValenceTv/navigation/Tab';

type TopBarProps = {
  current: Tab;
  onChoose: (tab: Tab) => void;
  profile: ViewerProfile | null;
  capsuleRef: (capsule: UpTarget) => void;
  onInBar: (isIn: boolean) => void;
};

export type { TopBarProps };
