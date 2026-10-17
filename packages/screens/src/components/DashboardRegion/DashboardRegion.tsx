import { ChevronRight as ChevronRightFilledIcon } from '@keyline-icons/react/fill';
import { PanelCard } from '@ValenceUI/PanelCard';
import { cn } from '@ValenceUI/cn';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import type { DashboardRegionProps } from './DashboardRegion.types';

/**
 * One region of the dashboard: a heading, an optional action in its corner, and whatever the region
 * shows. Exists so that every region is the same shape and spacing without each rebuilding it.
 *
 * @param title - What the region is called.
 * @param action - What its corner control does, where it has one.
 * @param onAction - Called when that control is pressed.
 * @param actionIcon - The icon on that control.
 * @param isActionBusy - Whether that control's work is in flight.
 * @param actions - A control other than the usual single button, for a corner that needs more than
 *   one choice.
 * @param isFlush - Whether what it shows runs to the card's edges, for a table.
 * @param children - What the region shows.
 * @param className - Anything extra the layout needs of it.
 */
const DashboardRegion = ({
  title,
  action,
  onAction,
  actionIcon,
  isActionBusy = false,
  actions,
  isFlush = false,
  children,
  className,
}: DashboardRegionProps) => (
  <PanelCard
    title={title}
    isFlush={isFlush}
    className={cn('h-full min-w-0', className)}
    {...(actions !== undefined
      ? { actions }
      : action === undefined || onAction === undefined
        ? {}
        : {
            actions: (
              <PanelCardAction
                icon={actionIcon ?? ChevronRightFilledIcon}
                onClick={onAction}
                isDisabled={isActionBusy}
                isLoading={isActionBusy}
              >
                {action}
              </PanelCardAction>
            ),
          })}
  >
    <div className="flex flex-1 flex-col">{children}</div>
  </PanelCard>
);

DashboardRegion.displayName = 'DashboardRegion';

export { DashboardRegion };
