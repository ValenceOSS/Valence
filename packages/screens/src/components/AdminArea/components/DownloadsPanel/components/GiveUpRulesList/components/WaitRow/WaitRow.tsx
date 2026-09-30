import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SettingRow } from '@ValenceUI/SettingRow';
import type { WaitRowProps } from './WaitRow.types';

const NEVER = 'never';

/**
 * One kind of trouble a download can get into, and how long Valence waits before giving up on it —
 * or never, which leaves the download alone however long it takes.
 *
 * @param title - What the trouble is.
 * @param description - What it looks like.
 * @param choices - The waits on offer, with never among them.
 * @param value - The wait now, or null for never.
 * @param unit - What the wait is counted in, for a wait none of the choices names.
 * @param onChange - Told the wait chosen, or null for never.
 */
const WaitRow = ({ title, description, choices, value, unit, onChange }: WaitRowProps) => {
  const selectedId = value === null ? NEVER : String(value);

  return (
    <SettingRow title={title} description={description}>
      <OptionMenu
        label={title}
        groups={[
          {
            name: 'Give up after',
            selectedId,
            onSelect: (id) => {
              onChange(id === NEVER ? null : Number(id));
            },
            options: choices,
          },
        ]}
        trigger={
          <>
            <span className="truncate">
              {choices.find((choice) => choice.id === selectedId)?.label ??
                `${String(value)} ${unit}`}
            </span>

            <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
          </>
        }
        triggerShape="field"
        align="end"
        className="w-44 max-w-full"
      />
    </SettingRow>
  );
};

WaitRow.displayName = 'WaitRow';

export { WaitRow };
