import { useState } from 'react';
import { ChoicePanel } from '@ValenceTv/components/ChoicePanel/ChoicePanel';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import type { FilterPanelProps } from './FilterPanel.types';
import { say } from '@ValenceI18n/say';

const ANY = 'any';

const CLEAR = 'clear';

/**
 * What a wall of films or programmes is narrowed by — genre, decade, rating, the viewer's own
 * rating — in the panel down the right, worked with the remote: first the kinds of filter, each
 * saying what it is set to, then the choices for the one picked, with Any to take it off. Choosing
 * goes back to the kinds, so several can be set in one visit; Menu goes back a step, then closes.
 *
 * @param groups - The kinds of filter, with the choices the libraries actually offer for each.
 * @param selected - What is chosen now.
 * @param onChange - Told everything chosen, whenever it changes.
 * @param onClose - Told to put the panel away.
 */
const FilterPanel = ({ groups, selected, onChange, onClose }: FilterPanelProps) => {
  const [open, setOpen] = useState<string | null>(null);
  const group = groups.find((one) => one.name === open) ?? null;

  useMenuButton(
    group === null
      ? onClose
      : () => {
          setOpen(null);
        },
    true,
  );

  if (group === null) {
    return (
      <ChoicePanel
        title={say('common.filters')}
        choices={[
          ...groups.map((one) => ({
            id: one.name,
            label: one.name,
            detail:
              one.options.find((option) => selected.has(option.id))?.label ?? say('common.any'),
            isCurrent: false,
          })),
          ...(selected.size === 0
            ? []
            : [{ id: CLEAR, label: say('common.clear'), isCurrent: false }]),
        ]}
        onChoose={(id) => {
          if (id === CLEAR) {
            onChange(new Set());

            return;
          }

          setOpen(id);
        }}
      />
    );
  }

  return (
    <ChoicePanel
      title={group.name}
      choices={[
        {
          id: ANY,
          label: say('common.any'),
          isCurrent: group.options.every((option) => !selected.has(option.id)),
        },
        ...group.options.map((option) => ({
          id: option.id,
          label: option.label,
          isCurrent: selected.has(option.id),
        })),
      ]}
      onChoose={(id) => {
        const next = new Set(
          [...selected].filter((chosen) => !group.options.some((option) => option.id === chosen)),
        );

        if (id !== ANY) {
          next.add(id);
        }

        onChange(next);
        setOpen(null);
      }}
    />
  );
};

FilterPanel.displayName = 'FilterPanel';

export { FilterPanel };
