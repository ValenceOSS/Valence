import { Switch } from '@ValenceUI/Switch';
import type { PermissionRowProps } from './PermissionRow.types';

/**
 * One permission a role can hold: what it is called, a sentence saying what it lets somebody do,
 * and a switch to give or take it.
 *
 * @param label - What it is called.
 * @param detail - What it lets somebody do.
 * @param isOn - Whether the role holds it.
 * @param onToggle - Told it was switched.
 */
const PermissionRow = ({ label, detail, isOn, onToggle }: PermissionRowProps) => (
  <li className="flex items-start justify-between gap-4 py-3 first:pt-0">
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <span className="text-xs leading-relaxed text-text-muted">{detail}</span>
    </div>

    <Switch
      label={label}
      isLabelHidden
      isOn={isOn}
      onToggle={onToggle}
      className="mt-0.5 shrink-0"
    />
  </li>
);

PermissionRow.displayName = 'PermissionRow';

export { PermissionRow };
