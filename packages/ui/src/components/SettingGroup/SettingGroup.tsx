import { cn } from '@ValenceUI/cn';
import type { SettingGroupProps } from './SettingGroup.types';

/**
 * A setting that is answered in several fields rather than one switch: what it is, and the fields
 * beneath it across the width of the list, side by side where there is room, so a mail server's
 * address and port read as one line of a form rather than a column pushed to the edge of the card.
 * Sits in a SettingList among its rows, and is spaced and divided as they are.
 *
 * @param title - What the setting is.
 * @param description - What answering it does, in a line or two.
 * @param children - The fields.
 * @param className - Extra classes for the caller's own layout.
 */
const SettingGroup = ({ title, description, children, className }: SettingGroupProps) => (
  <div data-slot="setting-group" className={cn('flex flex-col gap-3 py-4', className)}>
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[0.9375rem] font-semibold leading-tight text-text">{title}</span>

      {description === undefined ? null : (
        <span className="font-body text-[0.8125rem] leading-snug text-text-muted">
          {description}
        </span>
      )}
    </div>

    {children}
  </div>
);

SettingGroup.displayName = 'SettingGroup';

export { SettingGroup };
