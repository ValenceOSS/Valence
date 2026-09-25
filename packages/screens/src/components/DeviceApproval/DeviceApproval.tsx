import { say } from '@ValenceI18n/say';
import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { answerDeviceRequest, readDeviceRequest } from '@ValenceClient/session/auth';
import { tidyTheCode } from '@ValenceClient/session/tidyTheCode';
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
        <h1 className="text-2xl font-medium text-text">{say('screens.deviceApproval.heading')}</h1>

        <p className="text-sm text-text-muted">{say('screens.deviceApproval.lede', { name })}</p>
      </header>

      {standing === 'allowed' ? (
        <p className="text-base text-text">{say('screens.deviceApproval.allowed')}</p>
      ) : standing === 'refused' ? (
        <p className="text-base text-text">{say('screens.deviceApproval.refused')}</p>
      ) : standing === 'reading' ? (
        <Spinner label={say('screens.deviceApproval.checking')} />
      ) : standing === 'unknown' ? (
        <div className="flex flex-col gap-4">
          <p className="text-base text-text">{say('screens.deviceApproval.asking')}</p>

          <Button
            variant="glossy"
            size="lg"
            isLoading={isAnswering}
            onClick={() => {
              void answer(true);
            }}
          >
            {say('screens.deviceApproval.yes')}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              void answer(false);
            }}
          >
            {say('screens.deviceApproval.no')}
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
            label={say('screens.deviceApproval.codeLabel')}
            value={typed}
            onValueChange={setTyped}
            autoComplete="one-time-code"
            hasFocusOnMount
            {...(standing === 'wrong' ? { error: say('screens.deviceApproval.wrongCode') } : {})}
          />

          <Button type="submit" variant="glossy" size="lg" disabled={tidyTheCode(typed) === ''}>
            {say('screens.deviceApproval.continue')}
          </Button>
        </form>
      )}
    </main>
  );
};

DeviceApproval.displayName = 'DeviceApproval';

export { DeviceApproval };
