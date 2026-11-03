import type { ActionBarAction } from '@ValenceUI/ActionBar.types';

type RoundAction = ActionBarAction;

type RoundActionsProps = {
  label: string;
  actions: readonly RoundAction[];
  isCompact?: boolean;
  className?: string;
};

export type { RoundAction, RoundActionsProps };
