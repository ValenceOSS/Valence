import { say } from '@ValenceI18n/say';
import { useState } from 'react';
import { useUnderTheWindowBar } from '@ValenceScreens/desktop/useUnderTheWindowBar';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { Logo } from '@ValenceUI/Logo';
import { MoodBackground } from '@ValenceUI/MoodBackground';
import { revealVariants, revealTransition, staggerVariants } from '@ValenceUI/animations/reveal';
import { readServerAddress } from '@ValenceClient/session/readServerAddress';
import { reachServer } from './reachServer';
import { ServerChoices } from './components/ServerChoices/ServerChoices';
import type { ConnectToServerProps } from './ConnectToServer.types';

/**
 * An address as somebody would say it, without the part a browser adds for them.
 *
 * @param address - The address.
 * @returns It, less its scheme.
 */
const withoutScheme = (address: string): string => address.replace(/^https?:\/\//u, '');

/**
 * Asks which Valence this client is for, which a client that serves its own pages has no way of
 * knowing and a browser never has to ask.
 *
 * Dressed as the way in, because it is the way in. This and the profile gate are the two screens
 * somebody meets before there is anything of theirs to look at, and they are one moment rather than
 * two: the same backdrop, the same mark above the same size of heading, the same pill of a field and
 * the same button under it. Drawn as an ordinary form on a flat page, the first screen of the
 * application looked like a setup step for something else.
 *
 * The address is tried before it is kept. A typo that is only discovered at the next request looks
 * like a broken application rather than a wrong address, and somebody who has just installed
 * something has no reason to assume it is their fault.
 *
 * Somebody arriving here because the server they already named stopped answering is shown that
 * address and told so, rather than an empty box — they came here to correct a detail or to wait, not
 * to remember what they typed months ago.
 *
 * A server running on this machine is found rather than asked for, and offered as something to
 * press. Finding one is not the same as it being theirs — somebody may run two, or be setting one up
 * while watching another — so it is offered rather than assumed, and the box is still there for
 * anybody whose Valence is somewhere else.
 *
 * So is a server another machine on the network announced, under its own heading and by the name it
 * announced, since somebody choosing between the one on this machine and the one across the room
 * wants to know which is which. Both have answered before being offered, so pressing one connects.
 *
 * So, too, is one this client was pointed at before, since typing an address twice is typing it once
 * too many. Those have not necessarily answered lately, so pressing one tries it the way the box
 * would, and says so where it no longer answers. One already offered as found is not offered again.
 *
 * The foot names this build, where the client has one, for whoever is about to report that something
 * here did not work.
 *
 * @param onConnected - Told the address, once something answered at it.
 * @param startWith - What to put in the box, for somebody being asked again.
 * @param couldNotReach - The address that stopped answering, where that is why they are here.
 * @param reach - How to ask whether a Valence is there, which a test replaces.
 * @param found - Servers already found on this machine, which have answered before being offered.
 * @param nearby - Servers heard on the network, which have answered before being offered.
 * @param recent - Servers this client was pointed at before, the latest first.
 * @param build - What this build is, in the one line a bug report wants.
 */
const ConnectToServer = ({
  onConnected,
  startWith = '',
  couldNotReach,
  reach = reachServer,
  found = [],
  nearby = [],
  recent = [],
  build = null,
}: ConnectToServerProps) => {
  useUnderTheWindowBar();

  const [typed, setTyped] = useState(startWith);
  const [problem, setProblem] = useState<string | null>(
    couldNotReach === undefined
      ? null
      : say('screens.connectToServer.couldNotReach', { address: couldNotReach }),
  );
  const [asking, setAsking] = useState(false);
  const prefersReducedMotion = useReducedMotionConfig();

  const arrives = revealTransition(prefersReducedMotion);

  const tryAddress = async (address: string) => {
    setProblem(null);
    setAsking(true);

    const answered = await reach(address);

    setAsking(false);

    if (!answered) {
      setProblem(say('screens.connectToServer.nothingAnswered', { address }));

      return;
    }

    onConnected(address);
  };

  const connect = async () => {
    const read = readServerAddress(typed);

    if ('problem' in read) {
      setProblem(read.problem);

      return;
    }

    await tryAddress(read.address);
  };

  const offered = new Set([...found, ...nearby.map((one) => one.address)]);

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-y-auto px-6 pb-28 pt-16">
      <MoodBackground isDrifting />

      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="shown"
        className="flex w-full max-w-xl flex-col items-center gap-8"
      >
        <motion.span variants={revealVariants(prefersReducedMotion)} transition={arrives}>
          <Logo size={44} hasEdge isAnimated label={say('common.valence')} />
        </motion.span>

        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion, 'heavy')}
          className="flex flex-col items-center gap-2 text-center"
        >
          <h1 className="text-balance text-[clamp(1.75rem,5vw,3rem)] font-semibold leading-tight tracking-[-0.04em] text-text">
            {say('screens.connectToServer.heading')}
          </h1>

          <p className="text-sm text-text-muted">{say('screens.connectToServer.lede')}</p>
        </motion.div>

        <ServerChoices
          title={say('screens.connectToServer.foundHere')}
          choices={found.map((address) => ({ address, label: withoutScheme(address) }))}
          onChoose={onConnected}
          isDisabled={asking}
        />

        <ServerChoices
          title={say('screens.connectToServer.foundNearby')}
          choices={nearby.map((one) => ({
            address: one.address,
            label: one.name,
            detail: withoutScheme(one.address),
          }))}
          onChoose={onConnected}
          isDisabled={asking}
        />

        <ServerChoices
          title={say('screens.connectToServer.recent')}
          choices={recent
            .filter((address) => !offered.has(address))
            .map((address) => ({ address, label: withoutScheme(address) }))}
          onChoose={(address) => {
            setTyped(address);
            void tryAddress(address);
          }}
          isDisabled={asking}
        />

        <motion.form
          noValidate
          variants={revealVariants(prefersReducedMotion)}
          transition={arrives}
          className="flex w-full max-w-sm flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void connect();
          }}
        >
          <TextField
            label={say('screens.connectToServer.addressLabel')}
            value={typed}
            onValueChange={setTyped}
            placeholder={say('screens.connectToServer.addressPlaceholder')}
            size="lg"
            hasFocusOnMount
            {...(problem === null ? {} : { error: problem })}
          />

          <Button type="submit" variant="glossy" size="lg" isLoading={asking}>
            {asking
              ? say('screens.connectToServer.looking')
              : say('screens.connectToServer.connect')}
          </Button>
        </motion.form>
      </motion.div>

      <p className="absolute inset-x-6 bottom-8 truncate text-center text-xs text-text-muted/60">
        {build ?? say('screens.connectToServer.copyright')}
      </p>
    </main>
  );
};

ConnectToServer.displayName = 'ConnectToServer';

export { ConnectToServer };
