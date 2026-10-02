import { motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { popArrival } from '@ValenceUI/animations/reveal';
import { say } from '@ValenceI18n/say';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import { PosterDrift } from './components/PosterDrift/PosterDrift';
import type { WelcomeStepProps } from './WelcomeStep.types';

const BUTTON_LEAD = 0.45;

/**
 * The first step of setup: that nobody has an account here yet, what the next few minutes ask, and
 * the shelves waiting to be filled.
 *
 * @param onBegin - Told to go on to the first question.
 */
const WelcomeStep = ({ onBegin }: WelcomeStepProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.setUpValence')}
      lead={say('screens.setupWizard.welcomeStep.nobodyHasAnAccountHereYet')}
      actions={
        <motion.span className="flex" {...popArrival(BUTTON_LEAD, prefersReducedMotion === true)}>
          <Button variant="confirm" size="lg" onClick={onBegin}>
            {say('screens.setupWizard.welcomeStep.makeYourAccount')}
            <Icon of={ArrowRightIcon} size={16} />
          </Button>
        </motion.span>
      }
      aside={<PosterDrift />}
    />
  );
};

WelcomeStep.displayName = 'WelcomeStep';

export { WelcomeStep };
