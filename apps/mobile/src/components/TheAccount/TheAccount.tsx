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
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { TheAccountProps } from './TheAccount.types';

const styles = StyleSheet.create({
  leaving: { alignItems: 'center', gap: 10, marginTop: 12 },
});

const PANELS = [
  { id: 'profile', says: 'phone.theAccount.profilePanel' },
  { id: 'security', says: 'phone.theAccount.securityPanel' },
  { id: 'devices', says: 'phone.theAccount.devicesPanel' },
  { id: 'history', says: 'phone.theAccount.historyPanel' },
  { id: 'hidden', says: 'phone.theAccount.hiddenPanel' },
  { id: 'shares', says: 'phone.theAccount.sharesPanel' },
] as const satisfies readonly { id: string; says: StringKey }[];

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
  const panels = PANELS.map((one) => ({ id: one.id, label: say(one.says) }));

  return (
    <Screen scrolls>
      <Words size="title">{say('phone.theAccount.heading')}</Words>

      {who.data === null || who.data === undefined ? null : (
        <Words tone="muted">{who.data.email}</Words>
      )}

      <SegmentedRow
        label={say('phone.theAccount.whatToChange')}
        items={panels}
        value={panel}
        onSelect={setPanel}
      />

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
          {say('phone.theAccount.useADifferentServer')}
        </Button>

        <Button tone="ghost" icon={DoorOpen} isWide isDestructive onPress={onOut}>
          {say('phone.theAccount.signOut')}
        </Button>

        {address === null ? null : (
          <Words size="small" tone="muted">
            {say('phone.theAccount.watchingOn', { address })}
          </Words>
        )}
      </View>
    </Screen>
  );
};

TheAccount.displayName = 'TheAccount';

export { TheAccount };
