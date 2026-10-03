import { useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import type { Variants } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import { Logo } from '@ValenceUI/Logo';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Stepper } from '@ValenceUI/Stepper';
import { revealTransition } from '@ValenceUI/animations/reveal';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { readTheme } from '@ValenceClient/shell/theme';
import { useTheme } from '@ValenceClient/shell/useTheme';
import { signInWithUsernameOrEmail } from '@ValenceClient/session/auth';
import { completeSetup } from '@ValenceClient/setup/completeSetup';
import { finishSetupFlow } from '@ValenceClient/setup/finishSetupFlow';
import { finishOnboarding } from '@ValenceClient/household/fetchHousehold';
import { householdQueries } from '@ValenceClient/query/householdQueries';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { Library } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';
import { WayInBackground } from '@ValenceScreens/components/WayInBackground/WayInBackground';
import { THEME_CHOICES } from '@ValenceScreens/theme/themeChoices';
import { AccessStep } from './components/AccessStep/AccessStep';
import { AccountStep } from './components/AccountStep/AccountStep';
import { AddLibrariesStep } from './components/AddLibrariesStep/AddLibrariesStep';
import { ImportFromStep } from './components/ImportFromStep/ImportFromStep';
import { CatalogueStep } from './components/CatalogueStep/CatalogueStep';
import { DoneStep } from './components/DoneStep/DoneStep';
import { HouseholdStep } from './components/HouseholdStep/HouseholdStep';
import { ProfileStep } from './components/ProfileStep/ProfileStep';
import { WelcomeStep } from './components/WelcomeStep/WelcomeStep';
import type {
  AccountDraft,
  ImportedFrom,
  SetupStepId,
  SetupWizardProps,
} from './SetupWizard.types';

const ORDER: readonly SetupStepId[] = [
  'welcome',
  'account',
  'access',
  'profile',
  'household',
  'catalogue',
  'libraries',
  'import',
  'done',
];

const STEPS = [
  {
    id: 'welcome',
    label: say('screens.setupWizard.steps.welcome'),
    detail: say('screens.setupWizard.steps.whatSetupDoes'),
  },
  {
    id: 'account',
    label: say('screens.accountDialog.yourAccount'),
    detail: say('screens.setupWizard.steps.theAdministrator'),
  },
  {
    id: 'access',
    label: say('common.access'),
    detail: say('screens.setupWizard.steps.addressesAndHttps'),
  },
  {
    id: 'profile',
    label: say('screens.setupWizard.profileStep.yourProfile'),
    detail: say('screens.setupWizard.steps.howYouAppear'),
  },
  {
    id: 'household',
    label: say('screens.setupWizard.steps.yourHousehold'),
    detail: say('screens.setupWizard.steps.whoWatchesHere'),
  },
  {
    id: 'catalogue',
    label: say('screens.setupWizard.catalogueStep.titlesAndArtwork'),
    detail: say('screens.setupWizard.steps.aFreeCatalogueKey'),
  },
  {
    id: 'libraries',
    label: say('common.libraries'),
    detail: say('screens.setupWizard.steps.whereYourMediaIs'),
  },
  {
    id: 'import',
    label: say('screens.setupWizard.steps.importFromAnotherServer'),
    detail: say('screens.setupWizard.steps.ifYouAreMovingIn'),
  },
  {
    id: 'done',
    label: say('common.done'),
    detail: say('screens.setupWizard.steps.intoValence'),
  },
] as const;

const SLIDE = 56;

/**
 * How a step arrives and leaves: from the side it was reached from and out the other, or simply
 * fading for somebody who asked for less movement.
 *
 * @param prefersReducedMotion - What the system reports.
 * @returns The variants, which take the direction of travel.
 */
const slideVariants = (prefersReducedMotion: boolean | null): Variants =>
  prefersReducedMotion === true
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: (direction: number) => ({
          opacity: 0,
          x: direction * SLIDE,
          filter: 'blur(6px)',
        }),
        center: { opacity: 1, x: 0, filter: 'blur(0px)' },
        exit: (direction: number) => ({
          opacity: 0,
          x: direction * -SLIDE,
          filter: 'blur(6px)',
          transition: { duration: 0.18, ease: 'easeIn' },
        }),
      };

/**
 * Walks whoever opened Valence first through making it theirs, one step at a time: what setup does,
 * their account, how the server is reached, their profile and household, a catalogue key, their
 * libraries, and importing
 * from another server if they are moving, followed by what came of it. Steps that
 * follow making the account are shown again to the administrator after a reload, until they finish.
 *
 * @param status - What setup has established so far.
 * @param onComplete - Called once setup is finished and the app can open.
 * @param startsAt - Where to begin: the welcome, or the profile for an administrator coming back to
 *   finish.
 */
const SetupWizard = ({ status, onComplete, startsAt = 'welcome' }: SetupWizardProps) => {
  const cache = useQueryClient();
  const prefersReducedMotion = useReducedMotionConfig();
  const { theme, choose } = useTheme();
  const [step, setStep] = useState<SetupStepId>(startsAt);
  const direction = useTravelDirection(ORDER, step);
  const [draft, setDraft] = useState<AccountDraft>({
    name: '',
    username: '',
    email: '',
    password: '',
    again: '',
  });
  const [origins, setOrigins] = useState<string[]>([...status.suggestedTrustedOrigins]);
  const [cookieSecure, setCookieSecure] = useState(status.isSecureContext);
  const [isCreating, setIsCreating] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isMade, setIsMade] = useState(startsAt !== 'welcome');
  const [restartRequired, setRestartRequired] = useState(false);
  const [hasCatalogueKey, setHasCatalogueKey] = useState<boolean | null>(null);
  const [libraries, setLibraries] = useState<Library[] | null>(null);
  const [scans, setScans] = useState<ReadonlyMap<string, string>>(new Map());
  const [imported, setImported] = useState<ImportedFrom | null>(null);
  const [household, setHousehold] = useState('');

  const go = useCallback((to: SetupStepId) => {
    setProblem(null);
    setStep(to);
    window.scrollTo({ top: 0 });
  }, []);

  const create = async () => {
    setIsCreating(true);
    setProblem(null);

    const email = draft.email.trim();
    const made = await completeSetup({
      admin: {
        name: draft.name.trim(),
        username: draft.username.trim(),
        password: draft.password,
        ...(email === '' ? {} : { email }),
      },
      trustedOrigins: origins,
      cookieSecure,
    });

    if (made.kind === 'refused') {
      setIsCreating(false);
      setProblem(made.refusal?.message ?? say('screens.setupWizard.setupCouldNotBeCompletedCheck'));

      return;
    }

    if (!made.value.isSignedIn) {
      await signInWithUsernameOrEmail(draft.username.trim(), draft.password);
    }

    setIsCreating(false);
    setIsMade(true);
    setRestartRequired(made.value.restartRequired);
    go('profile');
  };

  const finish = async () => {
    await Promise.all([finishSetupFlow(), finishOnboarding()]);
    await cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
    await cache.invalidateQueries({ queryKey: householdQueries.key });
    onComplete();
  };

  const read = useCallback((found: Library[]) => {
    setLibraries(found);
  }, []);

  const content = (() => {
    switch (step) {
      case 'welcome':
        return (
          <WelcomeStep
            onBegin={() => {
              go('account');
            }}
          />
        );
      case 'account':
        return (
          <AccountStep
            draft={draft}
            onChange={setDraft}
            onBack={() => {
              go('welcome');
            }}
            onContinue={() => {
              go('access');
            }}
          />
        );
      case 'access':
        return (
          <AccessStep
            detectedOrigin={status.detectedOrigin}
            suggestedOrigins={status.suggestedTrustedOrigins}
            origins={origins}
            onOriginsChange={setOrigins}
            cookieSecure={cookieSecure}
            onCookieSecureChange={setCookieSecure}
            isCreating={isCreating}
            problem={problem}
            onBack={() => {
              go('account');
            }}
            onCreate={() => {
              void create();
            }}
          />
        );
      case 'profile':
        return (
          <ProfileStep
            onContinue={() => {
              go('household');
            }}
          />
        );
      case 'household':
        return (
          <HouseholdStep
            onBack={() => {
              go('profile');
            }}
            onContinue={(named) => {
              setHousehold(named);
              go('catalogue');
            }}
          />
        );
      case 'catalogue':
        return (
          <CatalogueStep
            onBack={() => {
              go('household');
            }}
            onSaved={() => {
              setHasCatalogueKey(true);
              go('libraries');
            }}
            onSkip={() => {
              setHasCatalogueKey(false);
              go('libraries');
            }}
          />
        );
      case 'libraries':
        return (
          <AddLibrariesStep
            libraries={libraries}
            scans={scans}
            onRead={read}
            onAdded={(library, jobId) => {
              setLibraries((held) => [...(held ?? []), library]);

              if (jobId !== null) {
                setScans((held) => new Map(held).set(library.id, jobId));
              }
            }}
            onBack={() => {
              go('catalogue');
            }}
            onContinue={() => {
              go('import');
            }}
          />
        );
      case 'import':
        return (
          <ImportFromStep
            onBack={() => {
              go('libraries');
            }}
            onDone={(what) => {
              setImported(what);
              go('done');
            }}
          />
        );
      case 'done':
        return null;
    }
  })();

  if (step === 'done') {
    return (
      <main className="relative min-h-svh overflow-x-clip">
        <WayInBackground />

        <DoneStep
          username={isMade && draft.username !== '' ? draft.username.trim() : null}
          origins={startsAt === 'welcome' ? origins : []}
          hasCatalogueKey={hasCatalogueKey}
          libraryCount={libraries?.length ?? 0}
          imported={imported}
          restartRequired={restartRequired}
          household={household}
          onFinish={() => {
            void finish();
          }}
        />
      </main>
    );
  }

  return (
    <main className="relative min-h-svh overflow-x-clip">
      <WayInBackground />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 pb-12 pt-[calc(1.25rem+var(--valence-window-bar))] sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: prefersReducedMotion === true ? 0 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={revealTransition(prefersReducedMotion)}
          className="flex items-center justify-between gap-4"
        >
          <Logo size={30} isSolid label={say('common.valence')} />

          <SegmentedRow
            size="sm"
            tone="accent"
            label={say('common.theme')}
            value={theme}
            items={THEME_CHOICES}
            onSelect={(picked) => {
              choose(readTheme(picked));
            }}
          />
        </motion.header>

        <div className="mt-8 grid flex-1 items-start gap-10 lg:mt-20 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-20">
          <aside className="lg:sticky lg:top-20">
            <Stepper label={say('screens.setupWizard.setUpValence')} steps={STEPS} current={step} />
          </aside>

          <div className="min-w-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants(prefersReducedMotion)}
                initial="enter"
                animate="center"
                exit="exit"
                transition={revealTransition(prefersReducedMotion)}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
};

SetupWizard.displayName = 'SetupWizard';

export { SetupWizard };
