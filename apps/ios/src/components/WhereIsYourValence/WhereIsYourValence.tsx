import { useState } from 'react';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import type { WhereIsYourValenceProps } from './WhereIsYourValence.types';

/**
 * Asks where this household's Valence is, which a phone cannot work out for itself.
 *
 * @param onChosen - Told the address somebody gave.
 * @param refusal - Why the last address did not answer, where one did not.
 */
const WhereIsYourValence = ({ onChosen, refusal = null }: WhereIsYourValenceProps) => {
  const [typed, setTyped] = useState('');

  return (
    <Screen centres>
      <Words size="title">Where is your Valence?</Words>
      <Words tone="muted">The address you open it on, such as http://192.168.1.10:8420</Words>

      <TextField
        label="Server address"
        value={typed}
        onValueChange={setTyped}
        placeholder="http://"
        keyboard="url"
        onSubmit={() => {
          onChosen(typed.trim());
        }}
      />

      {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

      <Button
        onPress={() => {
          onChosen(typed.trim());
        }}
      >
        Connect
      </Button>
    </Screen>
  );
};

WhereIsYourValence.displayName = 'WhereIsYourValence';

export { WhereIsYourValence };
