import { Check as CheckIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const STEPS = [
  { name: 'Admin account', rests: 'done', acts: 'done' },
  { name: 'Server name', rests: 'done', acts: 'done' },
  { name: 'Trusted origins', rests: 'now', acts: 'done' },
  { name: 'Libraries', rests: 'next', acts: 'now' },
] as const;

const MARKS = {
  done: 'border-success bg-success text-accent-contrast',
  now: 'border-accent text-accent',
  next: 'border-[var(--surface-line)] text-text-muted',
} as const;

const ACTED_MARKS = {
  done: 'acted:border-success acted:bg-success acted:text-accent-contrast',
  now: 'acted:border-accent acted:bg-transparent acted:text-accent',
  next: '',
} as const;

const PAGES = [
  {
    ask: 'Where will people open Valence?',
    label: 'Address',
    value: 'https://watch.home.lan',
    go: 'Continue',
  },
  {
    ask: 'Where is your media kept?',
    label: 'Folder',
    value: '/srv/media/films',
    go: 'Scan libraries',
  },
] as const;

/**
 * The first run wizard part way through; pointed at, the step it is on is ticked off and the next one opens.
 */
const SetupVignette = () => (
  <div className="valence-float flex w-full max-w-[var(--vignette-width)] gap-4 rounded-xl p-4">
    <span className="flex w-28 shrink-0 flex-col gap-2.5 pt-1">
      {STEPS.map((step) => (
        <span key={step.name} className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded-full border',
              ACTING,
              MARKS[step.rests],
              ACTED_MARKS[step.acts],
            )}
          >
            <span
              className={cn(
                'flex',
                ACTING,
                step.rests === 'done' ? '' : 'opacity-0',
                step.acts === 'done' ? 'acted:opacity-100' : '',
              )}
            >
              <Icon of={CheckIcon} size={9} />
            </span>
          </span>
          <span
            className={cn(
              ACTING,
              step.rests === 'next' ? 'text-text-muted acted:text-text' : 'text-text',
            )}
          >
            {step.name}
          </span>
        </span>
      ))}
    </span>

    <span className="grid min-w-0 flex-1">
      {PAGES.map((page, at) => (
        <span
          key={page.ask}
          className={cn(
            'flex min-w-0 flex-col gap-3 [grid-area:1/1]',
            ACTING,
            at === 0
              ? 'acted:-translate-x-3 acted:opacity-0'
              : 'translate-x-3 opacity-0 delay-150 acted:translate-x-0 acted:opacity-100',
          )}
        >
          <span className="text-sm font-medium text-text">{page.ask}</span>
          <TextField label={page.label} size="sm" value={page.value} onValueChange={nothing} />
          <Button variant="glossy" size="sm" className="self-end" onClick={nothing}>
            {page.go}
          </Button>
        </span>
      ))}
    </span>
  </div>
);

SetupVignette.displayName = 'SetupVignette';

export { SetupVignette };
