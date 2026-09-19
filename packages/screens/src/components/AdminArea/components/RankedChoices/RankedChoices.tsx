import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Icon } from '@ValenceUI/Icon';
import type { RankedChoicesProps } from './RankedChoices.types';

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
    <ol aria-label={label} className="flex flex-col gap-1">
      {chosen.map((id, place) => (
        <li key={id} className="flex items-center gap-2">
          <span className="w-5 text-right text-xs tabular-nums text-text-muted">
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
            label={`Move ${labelOf(id)} up`}
            disabled={place === 0}
            onClick={() => {
              move(place, place - 1);
            }}
          >
            <Icon of={ArrowUp01Icon} size={14} />
          </Button>

          <Button
            variant="ghost"
            size="xs"
            isIconOnly
            label={`Move ${labelOf(id)} down`}
            disabled={place === chosen.length - 1}
            onClick={() => {
              move(place, place + 1);
            }}
          >
            <Icon of={ArrowDown01Icon} size={14} />
          </Button>
        </li>
      ))}

      {unchosen.map((option) => (
        <li key={option.id} className="flex items-center gap-2 pl-7">
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
