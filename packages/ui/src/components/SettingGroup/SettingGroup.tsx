import { cn } from '@ValenceUI/cn';
import type { SettingGroupProps } from './SettingGroup.types';

/**
 * A setting that is answered in several fields rather than one switch: what it is, and the fields
 * beneath it across the width of the list, side by side where there is room, so a mail server's
 * address and port read as one line of a form rather than a column pushed to the edge of the card.
 * Sits in a SettingList among its rows, and is spaced and divided as they are. A fieldset, so a
 * screen reader announces what each field belongs to; its legend floats so it lays out as a heading.
 *
 * @param title - What the setting is.
 * @param description - What answering it does, in a line or two.
 * @param children - The fields.
 * @param className - Extra classes for the caller's own layout.
 */
const SettingGroup = ({ title, description, children, className }: SettingGroupProps) => (
  <fieldset
    data-slot="setting-group"
    className={cn('m-0 flex min-w-0 flex-col border-0 p-0 py-6', className)}
  >
    <legend className="float-left w-full p-0 text-base font-semibold leading-tight text-text">
      {title}
    </legend>

    {description === undefined ? null : (
      <p className="clear-both mt-1 font-body text-[0.8125rem] leading-snug text-text-muted">
        {description}
      </p>
    )}

    <div className="clear-both mt-5 min-w-0">{children}</div>
  </fieldset>
);

SettingGroup.displayName = 'SettingGroup';

export { SettingGroup };
