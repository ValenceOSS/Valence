import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';

type WindowBarProps = {
  update?: DesktopUpdate;
  onUpdate?: () => void;
};

export type { WindowBarProps };
