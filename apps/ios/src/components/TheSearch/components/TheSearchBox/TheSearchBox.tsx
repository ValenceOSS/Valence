import { useEffect, useState } from 'react';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import type { TheSearchBoxProps } from './TheSearchBox.types';

const HOLD_STILL_FOR = 250;

/**
 * Where somebody types what they are looking for.
 *
 * It keeps what is being typed to itself and says only what it has settled on, once they pause, so
 * the results under it are not drawn again at every letter.
 *
 * @param placeholder - What it says before anything is typed.
 * @param onSettle - Told what to look for, trimmed, once the typing has stopped for a moment.
 */
const TheSearchBox = ({ placeholder, onSettle }: TheSearchBoxProps) => {
  const [typed, setTyped] = useState('');
  const searchingFor = useSettled(typed.trim(), HOLD_STILL_FOR);

  useEffect(() => {
    onSettle(searchingFor);
  }, [searchingFor, onSettle]);

  return (
    <TextField
      label="Search"
      value={typed}
      onValueChange={setTyped}
      placeholder={placeholder}
      keyboard="search"
    />
  );
};

TheSearchBox.displayName = 'TheSearchBox';

export { TheSearchBox };
