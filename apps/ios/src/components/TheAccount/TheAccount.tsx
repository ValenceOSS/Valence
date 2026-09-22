import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValencePhone/components/Words/Words';
import { TheDevices } from '@ValencePhone/components/TheAccount/components/TheDevices/TheDevices';
import { TheDownloads } from '@ValencePhone/components/TheAccount/components/TheDownloads/TheDownloads';
import { TheHidden } from '@ValencePhone/components/TheAccount/components/TheHidden/TheHidden';
import { TheHistory } from '@ValencePhone/components/TheAccount/components/TheHistory/TheHistory';
import { TheProfile } from '@ValencePhone/components/TheAccount/components/TheProfile/TheProfile';
import type { TheAccountProps } from './TheAccount.types';

const PANELS = [
  { id: 'profile', label: 'Profile' },
  { id: 'devices', label: 'Devices' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'history', label: 'History' },
  { id: 'hidden', label: 'Hidden' },
] as const;

/**
 * Somebody's own account: how they appear, where they are signed in, what they have downloaded,
 * watched and hidden, and the way out.
 *
 * @param onOut - Told to sign out.
 * @param onWatchHeld - Told to play a film this phone keeps.
 */
const TheAccount = ({ onOut, onWatchHeld }: TheAccountProps) => {
  const who = useQuery(sessionQueries.who());
  const [panel, setPanel] = useState<string>('profile');

  return (
    <Screen scrolls>
      <Words size="title">Account</Words>

      {who.data === null || who.data === undefined ? null : (
        <Words tone="muted">{who.data.email}</Words>
      )}

      <SegmentedRow label="What to change" items={PANELS} value={panel} onSelect={setPanel} />

      {panel === 'devices' ? (
        <TheDevices />
      ) : panel === 'downloads' ? (
        <TheDownloads onWatch={onWatchHeld} />
      ) : panel === 'history' ? (
        <TheHistory />
      ) : panel === 'hidden' ? (
        <TheHidden />
      ) : (
        <TheProfile />
      )}

      <Button tone="quiet" onPress={onOut}>
        Sign out
      </Button>
    </Screen>
  );
};

TheAccount.displayName = 'TheAccount';

export { TheAccount };
