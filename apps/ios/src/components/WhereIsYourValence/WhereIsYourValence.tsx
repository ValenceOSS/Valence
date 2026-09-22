import { useState } from 'react';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import { theAddressesToTry } from '@ValencePhone/platform/theAddressesToTry';
import { whicheverAnswers } from '@ValencePhone/platform/whicheverAnswers';
import type { WhereIsYourValenceProps } from './WhereIsYourValence.types';

const NOT_THERE = 'Nothing answered at that address.';

/**
 * Asks where this household's Valence is, which a phone cannot work out for itself.
 *
 * What they type is tried before it is kept. Nobody writes a scheme, and an address saved without
 * one fails every request afterwards with nothing to say about why — so both are tried here, where
 * there is somebody to tell, rather than accepted and discovered later.
 *
 * @param onChosen - Told the address that answered.
 * @param refusal - Why the last address did not answer, where one did not.
 */
const WhereIsYourValence = ({ onChosen, refusal = null }: WhereIsYourValenceProps) => {
  const [typed, setTyped] = useState('');
  const [isTrying, setIsTrying] = useState(false);
  const [nothingThere, setNothingThere] = useState<string | null>(null);

  const tryIt = () => {
    const candidates = theAddressesToTry(typed);

    if (candidates.length === 0) {
      return;
    }

    setIsTrying(true);
    setNothingThere(null);

    void whicheverAnswers(candidates).then((answered) => {
      setIsTrying(false);

      if (answered === null) {
        setNothingThere(NOT_THERE);

        return;
      }

      onChosen(answered);
    });
  };

  return (
    <Screen centres>
      <Words size="title">Where is your Valence?</Words>
      <Words tone="muted">The address you open it on, such as 192.168.1.10:8420</Words>

      <TextField
        label="Server address"
        value={typed}
        onValueChange={setTyped}
        placeholder="valence.example"
        keyboard="url"
        onSubmit={tryIt}
      />

      {nothingThere === null && refusal === null ? null : (
        <Words tone="danger">{nothingThere ?? refusal}</Words>
      )}

      <Button isBusy={isTrying} onPress={tryIt}>
        Connect
      </Button>
    </Screen>
  );
};

WhereIsYourValence.displayName = 'WhereIsYourValence';

export { WhereIsYourValence };
