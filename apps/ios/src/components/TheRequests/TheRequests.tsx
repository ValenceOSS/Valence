import { useState } from 'react';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import { Asked } from '@ValencePhone/components/TheRequests/components/Asked/Asked';
import { Discovered } from '@ValencePhone/components/TheRequests/components/Discovered/Discovered';
import { Found } from '@ValencePhone/components/TheRequests/components/Found/Found';
import { useSettled } from '@ValenceClient/timing/useSettled';
import type { TheRequestsProps } from './TheRequests.types';

const HOLD_STILL_FOR = 400;

const SIDES = [
  { id: 'discover', label: 'Discover' },
  { id: 'asked', label: 'Requested' },
] as const;

/**
 * Somewhere to find films and programmes this server does not have yet and ask for them, and to
 * follow what has been asked for until it arrives.
 *
 * Searching looks through the whole catalogue rather than the library, and puts the rest back when
 * the box is cleared.
 *
 * @param onAsk - Told which title somebody wants to see, to ask for it or see where it stands.
 */
const TheRequests = ({ onAsk }: TheRequestsProps) => {
  const [typed, setTyped] = useState('');
  const [side, setSide] = useState<string>('discover');
  const searchingFor = useSettled(typed.trim(), HOLD_STILL_FOR);

  return (
    <Screen scrolls>
      <Words size="title">Requests</Words>

      <TextField
        label="Search for something new"
        value={typed}
        onValueChange={setTyped}
        placeholder="Search for something new"
        keyboard="search"
      />

      {searchingFor === '' ? (
        <>
          <SegmentedRow label="What to show" items={SIDES} value={side} onSelect={setSide} />

          {side === 'asked' ? <Asked onAsk={onAsk} /> : <Discovered onAsk={onAsk} />}
        </>
      ) : (
        <Found asked={searchingFor} onAsk={onAsk} />
      )}
    </Screen>
  );
};

TheRequests.displayName = 'TheRequests';

export { TheRequests };
