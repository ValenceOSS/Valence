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
import { ACCOUNT_PANELS } from '@ValenceMobile/components/TheAccount/ACCOUNT_PANELS';
import type { TheAccountProps } from './TheAccount.types';

const styles = StyleSheet.create({
  leaving: { alignItems: 'center', gap: 10, marginTop: 12 },
});

/**
 * Somebody's own account: how they appear, how they sign in, where they are signed in, what they
 * have watched and hidden, the links they have handed out, and the way out.
 *
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onOut - Told to sign out.
 * @param header - What stands above it where it slides in beneath the library's bar, as Search
 *   does, over the library's own background; its title is then the bar's.
 * @param onScrolled - Told whether it has been scrolled from its top.
 * @param shown - Which part of the account shows, where the library's bar chooses it; left out, the
 *   page chooses for itself with a row of its own.
 */
const TheAccount = ({ onOut, onElsewhere, header, onScrolled, shown }: TheAccountProps) => {
  const who = useQuery(sessionQueries.who());
  const [chosen, setChosen] = useState<string>('profile');
  const panel = shown ?? chosen;
  const address = platformInUse().serverAddress();

  return (
    <Screen
      scrolls
      isSeeThrough={header !== undefined}
      {...(onScrolled === undefined ? {} : { onScrolled })}
    >
      {header ?? <Words size="title">Account</Words>}

      {who.data === null || who.data === undefined ? null : (
        <Words tone="muted">{who.data.email}</Words>
      )}

      {shown === undefined ? (
        <SegmentedRow
          label="What to change"
          items={ACCOUNT_PANELS}
          value={panel}
          onSelect={setChosen}
        />
      ) : null}

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
