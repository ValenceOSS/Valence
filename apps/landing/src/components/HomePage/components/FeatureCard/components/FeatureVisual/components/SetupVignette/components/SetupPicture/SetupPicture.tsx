import { Button } from '@ValenceUI/Button';
import { Stepper } from '@ValenceUI/Stepper';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import type { SetupPictureProps } from './SetupPicture.types';

const STEPS = [
  { id: 'account', label: say('screens.accountDialog.yourAccount') },
  { id: 'access', label: say('common.access') },
  { id: 'libraries', label: say('common.libraries') },
  { id: 'done', label: say('common.done') },
] as const;

const PAGES = [
  {
    title: say('common.access'),
    label: say('screens.setupWizard.trustedOrigins'),
    value: 'https://watch.home.lan',
    go: say('screens.setupWizard.accessStep.createMyAccount'),
  },
  {
    title: say('screens.setupWizard.addLibrariesStep.yourLibraries'),
    label: say('common.addALibrary'),
    value: '/srv/media/films',
    go: say('common.continue'),
  },
] as const;

/**
 * The app's own first-run setup part way through, its stepper on the step being asked; the step is
 * finished and the next one opens.
 *
 * @param isOnLibraries - Whether setup has moved on from access to the libraries.
 */
const SetupPicture = ({ isOnLibraries = false }: SetupPictureProps) => (
  <div className="valence-float flex h-[19rem] w-[42rem] flex-col gap-6 rounded-xl p-6">
    <Stepper
      label={say('screens.setupWizard.setUpValence')}
      steps={STEPS}
      current={isOnLibraries ? 'libraries' : 'access'}
      shape="bar"
      className="w-[14.5rem]"
    />

    <span className="grid w-[14.5rem]">
      {PAGES.map((page, at) => (
        <span
          key={page.title}
          className={cn(
            'flex min-w-0 flex-col gap-4 [grid-area:1/1]',
            ACTING,
            at === 0
              ? 'acted:-translate-x-4 acted:opacity-0'
              : 'translate-x-4 opacity-0 delay-150 acted:translate-x-0 acted:opacity-100',
          )}
        >
          <span className="text-xl font-semibold tracking-[-0.03em] text-text">{page.title}</span>
          <TextField label={page.label} value={page.value} onValueChange={nothing} />
          <Button variant="confirm" className="self-start" onClick={nothing}>
            {page.go}
          </Button>
        </span>
      ))}
    </span>
  </div>
);

SetupPicture.displayName = 'SetupPicture';

export { SetupPicture };
