import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { answerDeviceRequest, readDeviceRequest } from '@ValenceClient/session/auth';
import { tidyTheCode } from './tidyTheCode';
import type { DeviceApprovalProps } from './DeviceApproval.types';

type Standing = 'asking' | 'reading' | 'unknown' | 'allowed' | 'refused' | 'wrong';

/**
 * The other half of signing a television in: the phone says yes.
 *
 * Reached by opening the address the television shows, or scanning its code, and then typing the code
 * the television shows. The code is always typed, never carried in the address: typing what is on the
 * screen is what shows that the person saying yes is in front of that television, rather than holding
 * a link or a photograph of one.
 *
 * The code is checked against the server before anything is offered, so what somebody approves is a
 * request that exists rather than a string they typed. Turning it down is offered as plainly as
 * letting it in, because somebody who was not expecting to be asked is the case this exists for.
 *
 * @param name - What this instance is called.
 */
const DeviceApproval = ({ name }: DeviceApprovalProps) => {
  const [typed, setTyped] = useState('');
  const [standing, setStanding] = useState<Standing>('asking');
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    if (standing !== 'reading') {
      return;
    }

    let isStillHere = true;

    void readDeviceRequest(tidyTheCode(typed)).then((found) => {
      if (!isStillHere) {
        return;
      }

      setStanding(found === null ? 'wrong' : found.status === 'pending' ? 'unknown' : 'wrong');
    });

    return () => {
      isStillHere = false;
    };
  }, [standing, typed]);

  const answer = async (isAllowed: boolean): Promise<void> => {
    setIsAnswering(true);

    const recorded = await answerDeviceRequest(tidyTheCode(typed), isAllowed);

    setIsAnswering(false);
    setStanding(!recorded ? 'wrong' : isAllowed ? 'allowed' : 'refused');
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-text">Sign in a television</h1>

        <p className="text-sm text-text-muted">
          A television showed you a code. Type it here and {name} will let it in as you.
        </p>
      </header>

      {standing === 'allowed' ? (
        <p className="text-base text-text">
          Done. The television should be watching in a moment — you can close this.
        </p>
      ) : standing === 'refused' ? (
        <p className="text-base text-text">
          Turned down. Nothing was signed in, and the code on that screen is now useless.
        </p>
      ) : standing === 'reading' ? (
        <Spinner label="Checking that code" />
      ) : standing === 'unknown' ? (
        <div className="flex flex-col gap-4">
          <p className="text-base text-text">
            A television is asking to sign in as you. Only say yes if it is the one in front of you.
          </p>

          <Button
            variant="glossy"
            size="lg"
            isLoading={isAnswering}
            onClick={() => {
              void answer(true);
            }}
          >
            Yes, that is mine
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              void answer(false);
            }}
          >
            No, I did not ask for this
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setStanding('reading');
          }}
        >
          <TextField
            label="The code on the television"
            value={typed}
            onValueChange={setTyped}
            autoComplete="one-time-code"
            hasFocusOnMount
            {...(standing === 'wrong'
              ? { error: 'That code has run out, or there is no television waiting on it.' }
              : {})}
          />

          <Button type="submit" variant="glossy" size="lg" disabled={tidyTheCode(typed) === ''}>
            Continue
          </Button>
        </form>
      )}
    </main>
  );
};

DeviceApproval.displayName = 'DeviceApproval';

export { DeviceApproval };
