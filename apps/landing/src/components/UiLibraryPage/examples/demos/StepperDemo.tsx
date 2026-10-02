import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Stepper } from '@ValenceUI/Stepper';

const STEPS = [
  { id: 'account', label: 'Your account', detail: 'The administrator' },
  { id: 'access', label: 'How Valence is reached', detail: 'Addresses and HTTPS' },
  { id: 'libraries', label: 'Libraries', detail: 'Where your media is' },
  { id: 'done', label: 'Done', detail: 'Into Valence' },
] as const;

/**
 * A working stepper: the list of steps beside the bar it folds into, moved on and back with two
 * buttons, so the mark sliding between steps and the ticks landing can be seen.
 */
const StepperDemo = () => {
  const [at, setAt] = useState(1);
  const current = STEPS[at]?.id ?? 'account';

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="grid gap-8 sm:grid-cols-2">
        <Stepper label="Setup" steps={STEPS} current={current} shape="list" />
        <Stepper label="Setup, folded" steps={STEPS} current={current} shape="bar" />
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={at === 0}
          onClick={() => {
            setAt((held) => Math.max(0, held - 1));
          }}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={at === STEPS.length - 1}
          onClick={() => {
            setAt((held) => Math.min(STEPS.length - 1, held + 1));
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

StepperDemo.displayName = 'StepperDemo';

export { StepperDemo };
