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
 * @param isDisabled - Whether it is held through something wider and so cannot be switched alone.
 */
const PermissionRow = ({
  label,
  detail,
  isOn,
  onToggle,
  isDisabled = false,
}: PermissionRowProps) => (
  <li className="flex items-center justify-between gap-4 px-4 py-3">
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <span className="text-xs text-text-muted">{detail}</span>
    </div>

    <Switch
      label={label}
      isLabelHidden
      isOn={isOn}
      onToggle={onToggle}
      disabled={isDisabled}
      className="shrink-0"
    />
  </li>
);

PermissionRow.displayName = 'PermissionRow';

export { PermissionRow };
