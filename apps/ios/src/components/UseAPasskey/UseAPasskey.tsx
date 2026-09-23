import { useState } from 'react';
import { KeyRound } from 'lucide-react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { signInThroughTheBrowser } from '@ValencePhone/platform/signInThroughTheBrowser';
import type { UseAPasskeyProps } from './UseAPasskey.types';

/**
 * Signs somebody in with a passkey, through the Valence web page in the system's browser sheet.
 *
 * Closing the sheet says nothing, because somebody who changed their mind knows they did.
 *
 * @param label - What the button says.
 * @param onIn - Told once they are through.
 */
const UseAPasskey = ({ label, onIn }: UseAPasskeyProps) => {
  const [isTrying, setIsTrying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const tryIt = async () => {
    setIsTrying(true);
    setHasFailed(false);

    const outcome = await signInThroughTheBrowser();

    setIsTrying(false);

    if (outcome === 'in') {
      onIn();

      return;
    }

    setHasFailed(outcome === 'failed');
  };

  return (
    <>
      {hasFailed ? <Words tone="danger">That did not sign you in. Try again.</Words> : null}

      <Button
        tone="ghost"
        icon={KeyRound}
        isBusy={isTrying}
        onPress={() => {
          void tryIt();
        }}
      >
        {label}
      </Button>
    </>
  );
};

UseAPasskey.displayName = 'UseAPasskey';

export { UseAPasskey };
