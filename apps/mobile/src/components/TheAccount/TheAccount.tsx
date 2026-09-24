import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { DoorOpen, Server } from '@keyline-icons/react-native';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { TheDevices } from '@ValenceMobile/components/TheAccount/components/TheDevices/TheDevices';
import { TheHidden } from '@ValenceMobile/components/TheAccount/components/TheHidden/TheHidden';
import { TheHistory } from '@ValenceMobile/components/TheAccount/components/TheHistory/TheHistory';
import { TheShares } from '@ValenceMobile/components/TheAccount/components/TheShares/TheShares';
import { TheSecurity } from '@ValenceMobile/components/TheAccount/components/TheSecurity/TheSecurity';
import { TheProfile } from '@ValenceMobile/components/TheAccount/components/TheProfile/TheProfile';
import type { TheAccountProps } from './TheAccount.types';

const styles = StyleSheet.create({
  leaving: { alignItems: 'center', gap: 10, marginTop: 12 },
});

const PANELS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'devices', label: 'Devices' },
  { id: 'history', label: 'History' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'shares', label: 'Shares' },
] as const;

/**
 * Somebody's own account: how they appear, how they sign in, where they are signed in, what they
 * have watched and hidden, the links they have handed out, and the way out.
 *
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onOut - Told to sign out.
 */
const TheAccount = ({ onOut, onElsewhere }: TheAccountProps) => {
  const who = useQuery(sessionQueries.who());
  const [panel, setPanel] = useState<string>('profile');
  const address = platformInUse().serverAddress();

  return (
    <Screen scrolls>
      <Words size="title">Account</Words>

      {who.data === null || who.data === undefined ? null : (
        <Words tone="muted">{who.data.email}</Words>
      )}

      <SegmentedRow label="What to change" items={PANELS} value={panel} onSelect={setPanel} />

      {panel === 'security' ? (
        <TheSecurity />
      ) : panel === 'devices' ? (
        <TheDevices />
      ) : panel === 'history' ? (
        <TheHistory />
      ) : panel === 'hidden' ? (
        <TheHidden />
      ) : panel === 'shares' ? (
        <TheShares />
      ) : (
        <TheProfile />
      )}

      <View style={styles.leaving}>
        <Button tone="ghost" icon={Server} isWide onPress={onElsewhere}>
          Use a different server
        </Button>

        <Button tone="ghost" icon={DoorOpen} isWide isDestructive onPress={onOut}>
          Sign out
        </Button>

        {address === null ? null : (
          <Words size="small" tone="muted">{`Watching on ${address}`}</Words>
        )}
      </View>
    </Screen>
  );
};

TheAccount.displayName = 'TheAccount';

export { TheAccount };
