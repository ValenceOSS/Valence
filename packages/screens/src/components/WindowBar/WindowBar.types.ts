import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';
import type { NotificationBellProps } from '@ValenceScreens/components/NotificationBell/NotificationBell.types';

type WindowBarWays = {
  canGoBack: boolean;
  canGoForward: boolean;
  back: () => void;
  forward: () => void;
};

type WindowBarProps = {
  update?: DesktopUpdate;
  onUpdate?: () => void;
  ways?: WindowBarWays;
  keys?: { back: readonly string[]; forward: readonly string[] };
  inbox?: NotificationBellProps;
  onHelp?: () => void;
};

export type { WindowBarProps, WindowBarWays };
