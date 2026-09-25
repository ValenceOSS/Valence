import { say } from '@ValenceI18n/say';
import { useState } from 'react';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { Slider } from '@ValenceUI/Slider';
import { setQueueConcurrency } from '@ValenceClient/admin/fetchAdmin';
import type { QueueConcurrencyProps } from './QueueConcurrency.types';

const MOST_TO_OFFER = 16;

/**
 * How many background jobs run at once, as the button that says so and the slider behind it that
 * changes it. Raising it lets waiting work start at once; lowering it takes effect as work finishes,
 * and nothing already running is cut short. Sixteen is as far as the slider goes: past that is not a
 * faster machine but a slower one, with every job fighting the others for the same disk.
 *
 * @param concurrency - How many run at once now.
 */
const QueueConcurrency = ({ concurrency }: QueueConcurrencyProps) => {
  const [chosen, setChosen] = useState<number | null>(null);

  return (
    <PopoverPanel
      label={say('screens.queueConcurrency.label')}
      heading={say('screens.queueConcurrency.heading')}
      side="bottom"
      align="end"
      triggerLook="button"
      className="w-64"
      trigger={
        <AnimatedNumber
          value={concurrency}
          suffix={say('screens.queueConcurrency.atATimeSuffix')}
        />
      }
    >
      <div className="flex flex-col gap-3 p-1">
        <Slider
          label={say('screens.queueConcurrency.sliderLabel')}
          value={chosen ?? concurrency}
          max={MOST_TO_OFFER}
          onValueChange={setChosen}
          onValueCommit={(next) => {
            setChosen(null);
            void setQueueConcurrency(Math.max(1, next));
          }}
        />

        <p className="text-xs leading-relaxed text-text-muted">
          {say('screens.queueConcurrency.explanation')}
        </p>
      </div>
    </PopoverPanel>
  );
};

QueueConcurrency.displayName = 'QueueConcurrency';

export { QueueConcurrency };
