import { useId } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { popArrival } from '@ValenceUI/animations/reveal';
import { say } from '@ValenceI18n/say';
import { languageChoices } from '@ValenceClient/language/languageChoices';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import { PosterDrift } from './components/PosterDrift/PosterDrift';
import type { WelcomeStepProps } from './WelcomeStep.types';

const BUTTON_LEAD = 0.45;

/**
 * The first step of setup: that nobody has an account here yet, what the next few minutes ask, the
 * language the server speaks to everybody who does not choose their own, the code from the server's
 * log that shows whoever is setting it up runs it, and the shelves waiting to
 * be filled.
 *
 * @param language - The language chosen, or the choice to follow each device.
 * @param onLanguageChange - Told when another is chosen.
 * @param setupCode - The code typed so far.
 * @param onSetupCodeChange - Told as it changes.
 * @param problem - Why the code was refused, where it was.
 * @param onBegin - Told to go on to the first question, once a code is typed.
 */
const WelcomeStep = ({
  language,
  onLanguageChange,
  setupCode,
  onSetupCodeChange,
  problem,
  onBegin,
}: WelcomeStepProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const formId = useId();
  const hasCode = setupCode.trim() !== '';

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.setUpValence')}
      lead={say('screens.setupWizard.welcomeStep.nobodyHasAnAccountHereYet')}
      actions={
        <motion.span className="flex" {...popArrival(BUTTON_LEAD, prefersReducedMotion === true)}>
          <Button type="submit" form={formId} variant="confirm" size="lg" disabled={!hasCode}>
            {say('screens.setupWizard.welcomeStep.makeYourAccount')}
            <Icon of={ArrowRightIcon} size={16} />
          </Button>
        </motion.span>
      }
      aside={<PosterDrift />}
    >
      <form
        id={formId}
        noValidate
        className="flex max-w-sm flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();

          if (hasCode) {
            onBegin();
          }
        }}
      >
        <SelectField
          label={say('common.language')}
          options={languageChoices(say('screens.adminArea.serverCard.eachDevicesOwn'))}
          value={language}
          onSelect={onLanguageChange}
          description={say('screens.setupWizard.welcomeStep.languageDetail')}
        />

        <TextField
          label={say('screens.setupWizard.welcomeStep.setupCode')}
          value={setupCode}
          onValueChange={onSetupCodeChange}
          autoComplete="off"
          hasFocusOnMount
          description={say('screens.setupWizard.welcomeStep.printedInTheServerLog')}
          descriptionPlacement="below"
          {...(problem === null ? {} : { error: problem })}
        />
      </form>
    </SetupStepFrame>
  );
};

WelcomeStep.displayName = 'WelcomeStep';

export { WelcomeStep };
