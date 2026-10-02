import { motion, useReducedMotionConfig } from 'motion/react';
import { Alert as AlertIcon, Check as CheckIcon, Minus as MinusIcon } from '@keyline-icons/react';
import { Callout } from '@ValenceUI/Callout';
import { Icon } from '@ValenceUI/Icon';
import { revealItemVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { WelcomeToValence } from '@ValenceScreens/components/WelcomeToValence/WelcomeToValence';
import type { DoneStepProps } from './DoneStep.types';

/**
 * The end of setting up, drawn as every first sign-in ends, with the household's name back at them,
 * and under it what came of setting up: the account, the addresses trusted, the catalogue key, the libraries and
 * anything imported, each said as done or as left for later, and the way into Valence. Where
 * the HTTPS choice needs the server started again, it says so before anybody finds out the hard way.
 *
 * @param username - The administrator's username, where this visit made it.
 * @param origins - The addresses trusted, where this visit set them.
 * @param hasCatalogueKey - Whether a catalogue key is set, where that is known.
 * @param libraryCount - How many libraries there are.
 * @param imported - What came across from another server, where that was asked.
 * @param restartRequired - Whether the server must be started again for the HTTPS choice to hold.
 * @param household - What the household is called.
 * @param onFinish - Told to close setup and open Valence.
 */
const DoneStep = ({
  username,
  origins,
  hasCatalogueKey,
  libraryCount,
  imported,
  restartRequired,
  household,
  onFinish,
}: DoneStepProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  const lines: { id: string; isDone: boolean; text: string }[] = [
    ...(username === null
      ? []
      : [
          {
            id: 'account',
            isDone: true,
            text: say('screens.setupWizard.doneStep.yourAccountUsername', { username }),
          },
        ]),
    ...(origins.length === 0
      ? []
      : [
          {
            id: 'access',
            isDone: true,
            text: sayCount('screens.setupWizard.doneStep.countTrustedAddresses', origins.length),
          },
        ]),
    ...(hasCatalogueKey === null
      ? []
      : [
          {
            id: 'catalogue',
            isDone: hasCatalogueKey,
            text: hasCatalogueKey
              ? say('screens.setupWizard.doneStep.aCatalogueKeyIsSet')
              : say('screens.setupWizard.doneStep.noCatalogueKeyYet'),
          },
        ]),
    {
      id: 'libraries',
      isDone: libraryCount > 0,
      text:
        libraryCount > 0
          ? sayCount('common.count.libraries', libraryCount)
          : say('screens.setupWizard.doneStep.noLibrariesYet'),
    },
    ...(imported === null
      ? []
      : [
          {
            id: 'import',
            isDone: true,
            text:
              imported === 'server'
                ? say('screens.setupWizard.doneStep.importedFromYourOldServer')
                : imported === 'requests'
                  ? say('screens.setupWizard.doneStep.yourRequestingAppsAreConnected')
                  : say('screens.setupWizard.doneStep.startedFresh'),
          },
        ]),
  ];

  return (
    <WelcomeToValence name={say('common.valence')} household={household} onFinished={onFinish}>
      <div className="flex flex-col gap-5">
        <motion.ul
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="flex flex-col"
        >
          {lines.map((line, index) => (
            <motion.li
              key={line.id}
              custom={index}
              variants={revealItemVariants(prefersReducedMotion)}
              className="flex items-center gap-3 border-b border-[var(--surface-line)] py-2.5 last:border-b-0"
            >
              <Icon
                of={line.isDone ? CheckIcon : MinusIcon}
                size={16}
                {...(line.isDone ? {} : { tone: 'muted' as const })}
              />

              <span className={cn('text-sm', line.isDone ? 'text-text' : 'text-text-muted')}>
                {line.text}
              </span>
            </motion.li>
          ))}
        </motion.ul>

        {restartRequired ? (
          <Callout
            tone="warning"
            icon={AlertIcon}
            title={say('screens.setupWizard.doneStep.startValenceAgain')}
          >
            {say('screens.setupWizard.doneStep.theHttpsChoiceHoldsOnceItStartsAgain')}
          </Callout>
        ) : null}
      </div>
    </WelcomeToValence>
  );
};

DoneStep.displayName = 'DoneStep';

export { DoneStep };
