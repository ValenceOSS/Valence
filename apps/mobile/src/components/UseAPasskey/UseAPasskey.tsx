import { KeyRound } from '@keyline-icons/react-native';
import { useState } from 'react';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { signInThroughTheBrowser } from '@ValenceMobile/platform/signInThroughTheBrowser';
import type { UseAPasskeyProps } from './UseAPasskey.types';
import { say } from '@ValenceI18n/say';

/**
 * Signs somebody in with a passkey, through the Valence web page in the system's browser sheet.
 *
 * Closing the sheet says nothing, because somebody who changed their mind knows they did.
 *
 * @param label - What the button says.
 * @param onIn - Told once they are through.
 * @param profileId - The profile somebody already chose, which the page then asks for straight away.
 */
const UseAPasskey = ({ label, onIn, profileId }: UseAPasskeyProps) => {
  const [isTrying, setIsTrying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const tryIt = async () => {
    setIsTrying(true);
    setHasFailed(false);

    const outcome = await signInThroughTheBrowser(profileId ?? null);

    setIsTrying(false);

    if (outcome === 'in') {
      onIn();

      return;
    }

    setHasFailed(outcome === 'failed');
  };

  return (
    <>
      {hasFailed ? <Words tone="danger">{say('common.thatDidNotSignYouIn')}</Words> : null}

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
