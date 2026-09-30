import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SlidingMark } from '@ValenceUI/SlidingMark';

const CHOICES = ['Day', 'Week', 'Month', 'Year'] as const;

/**
 * A row of choices where the mark behind the chosen one glides to the next, rather than one lighting
 * and another going out.
 */
const SlidingMarkDemo = () => {
  const [chosen, setChosen] = useState<string>('Week');

  return (
    <div className="flex gap-1 rounded-md border border-[var(--surface-line)] bg-[var(--surface-hover)] p-1">
      {CHOICES.map((choice) => (
        <Button
          key={choice}
          variant="bare"
          size="none"
          hasTooltip={false}
          isActive={choice === chosen}
          className="relative rounded-md px-3 py-1.5 text-sm text-text"
          onClick={() => {
            setChosen(choice);
          }}
        >
          {choice === chosen ? (
            <SlidingMark
              group="ui-library-sliding-mark"
              className="rounded-md bg-[var(--surface-active)]"
            />
          ) : null}
          <span className="relative">{choice}</span>
        </Button>
      ))}
    </div>
  );
};

SlidingMarkDemo.displayName = 'SlidingMarkDemo';

export { SlidingMarkDemo };
