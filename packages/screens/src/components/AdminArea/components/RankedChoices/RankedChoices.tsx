import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Icon } from '@ValenceUI/Icon';
import type { RankedChoicesProps } from './RankedChoices.types';
import { say } from '@ValenceI18n/say';

/**
 * A list of choices somebody both picks from and puts in order: what is ticked is allowed, and its
 * place says how much it is preferred, first best. Ticking one puts it last; the arrows move it.
 *
 * @param label - What the choices are, for anybody who cannot see the list.
 * @param options - Every choice there is.
 * @param chosen - The ticked ones, best first.
 * @param onChange - Told the ticked ones, in their new order.
 */
const RankedChoices = <Choice extends string>({
  label,
  options,
  chosen,
  onChange,
}: RankedChoicesProps<Choice>) => {
  const labelOf = (id: Choice) => options.find((option) => option.id === id)?.label ?? id;
  const unchosen = options.filter((option) => !chosen.includes(option.id));

  const move = (from: number, to: number) => {
    const next = [...chosen];
    const [moving] = next.splice(from, 1);

    if (moving !== undefined) {
      next.splice(to, 0, moving);
      onChange(next);
    }
  };

  return (
    <ol
      aria-label={label}
      className="flex flex-col divide-y divide-[var(--surface-line)] overflow-hidden rounded-lg border border-[var(--surface-line)]"
    >
      {chosen.map((id, place) => (
        <li
          key={id}
          className="flex h-10 items-center gap-2.5 pl-3 pr-1.5 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-hover)]"
        >
          <span className="w-4 text-right text-xs tabular-nums text-text-muted">
            {(place + 1).toString()}
          </span>

          <Checkbox
            label={labelOf(id)}
            checked
            onCheckedChange={() => {
              onChange(chosen.filter((one) => one !== id));
            }}
            className="flex-1"
          />

          <Button
            variant="ghost"
            size="xs"
            isIconOnly
            label={say('screens.adminArea.rankedChoices.moveIdUp', { id: labelOf(id) })}
            disabled={place === 0}
            onClick={() => {
              move(place, place - 1);
            }}
          >
            <Icon of={ChevronUpIcon} size={14} />
          </Button>

          <Button
            variant="ghost"
            size="xs"
            isIconOnly
            label={say('screens.adminArea.rankedChoices.moveIdDown', { id: labelOf(id) })}
            disabled={place === chosen.length - 1}
            onClick={() => {
              move(place, place + 1);
            }}
          >
            <Icon of={ChevronDownIcon} size={14} />
          </Button>
        </li>
      ))}

      {unchosen.map((option) => (
        <li
          key={option.id}
          className="flex h-10 items-center gap-2.5 pl-[2.125rem] pr-1.5 text-text-muted transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-hover)]"
        >
          <Checkbox
            label={option.label}
            checked={false}
            onCheckedChange={() => {
              onChange([...chosen, option.id]);
            }}
          />
        </li>
      ))}
    </ol>
  );
};

RankedChoices.displayName = 'RankedChoices';

export { RankedChoices };
