import type { ActionBarAction } from '@ValenceUI/ActionBar.types';

type RoundAction = ActionBarAction & {
  isChosen?: boolean;
  isDisabled?: boolean;
};

type RoundActionsProps = {
  label: string;
  actions: readonly RoundAction[];
  isCompact?: boolean;
  className?: string;
};

export type { RoundAction, RoundActionsProps };
