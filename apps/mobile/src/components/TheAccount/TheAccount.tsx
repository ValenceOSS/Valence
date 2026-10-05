import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import {
  Clock,
  DoorOpen,
  EyeOff,
  Link,
  Server,
  Settings,
  ShieldCheck,
  Smartphone,
} from '@keyline-icons/react-native';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { AnAccountRow } from '@ValenceMobile/components/AnAccountRow/AnAccountRow';
import { AThemeChoice } from '@ValenceMobile/components/AThemeChoice/AThemeChoice';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useAccountPanels } from '@ValenceMobile/components/TheAccount/useAccountPanels';
import { ACCOUNT_PANELS } from '@ValenceMobile/components/TheAccount/ACCOUNT_PANELS';
import type { TheAccountProps } from './TheAccount.types';
import { say } from '@ValenceI18n/say';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

const styles = StyleSheet.create({
  about: { alignItems: 'center', gap: 4 },
  head: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  leaving: { gap: 10 },
});

/**
 * The account tab: who is watching, with a way to change their profile, then one row for each part
 * of the account (security, devices, history, hidden titles, share links and any plugin pages), each
 * opening a page of its own. Beneath them are the ways out and the server in use, with the app's and
 * the server's versions, and a note when the server is older than the app.
 *
 * @param onOut - Told to sign out.
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onOpen - Told to open one part of the account, by its panel id.
 * @param header - What stands above it where it slides in beneath the library's bar.
 * @param onScrolled - Told whether it has been scrolled from its top.
 */
const TheAccount = ({ onOut, onElsewhere, onOpen, header, onScrolled }: TheAccountProps) => {
  const watching = useQuery(profileQueries.watching());
  const server = useQuery(aboutQueries.server());
  const reportsFeatures = useServerHas('server.reportsFeatures');
  const { isDemo } = useWhatIMayDo();
  const panels = useAccountPanels();
  const pluginPanels = panels.filter((panel) =>
    ACCOUNT_PANELS.every((ours) => ours.id !== panel.id),
  );
  const address = platformInUse().serverAddress();
  const builds = describeTheBuild(theBuildInfo(), server.data ?? null);
  const profile = watching.data ?? null;

  return (
    <Screen
      scrolls
      isSeeThrough={header !== undefined}
      {...(onScrolled === undefined ? {} : { onScrolled })}
    >
      {header ?? <Words size="title">{say('common.account')}</Words>}

      {profile === null ? null : (
        <View style={styles.head}>
          <AFace profile={profile} isLarge />
          <Words size="heading">{profile.name}</Words>
          <Button
            tone="quiet"
            onPress={() => {
              onOpen('profile');
            }}
          >
            {say('phone.theAccount.editProfile')}
          </Button>
        </View>
      )}

      {isDemo ? null : (
        <AGroup title={say('phone.theAccount.signInAndDevices')}>
          <AnAccountRow
            icon={ShieldCheck}
            says={say('common.security')}
            detail={say('phone.theAccount.securityDetail')}
            onPress={() => {
              onOpen('security');
            }}
          />
          <AnAccountRow
            icon={Smartphone}
            says={say('common.devices')}
            detail={say('phone.theAccount.devicesDetail')}
            onPress={() => {
              onOpen('devices');
            }}
          />
        </AGroup>
      )}

      <AGroup title={say('phone.theAccount.watchingAndSharing')}>
        <AnAccountRow
          icon={Clock}
          says={say('common.history')}
          detail={say('phone.theAccount.historyDetail')}
          onPress={() => {
            onOpen('history');
          }}
        />
        <AnAccountRow
          icon={EyeOff}
          says={say('common.hidden')}
          detail={say('phone.theAccount.hiddenDetail')}
          onPress={() => {
            onOpen('hidden');
          }}
        />
        <AnAccountRow
          icon={Link}
          says={say('common.sharedLinks')}
          detail={say('phone.theAccount.sharesDetail')}
          onPress={() => {
            onOpen('shares');
          }}
        />
      </AGroup>

      {pluginPanels.length === 0 ? null : (
        <AGroup title={say('common.plugins')}>
          {pluginPanels.map((panel) => (
            <AnAccountRow
              key={panel.id}
              icon={panel.icon ?? Settings}
              says={panel.label}
              onPress={() => {
                onOpen(panel.id);
              }}
            />
          ))}
        </AGroup>
      )}

      <AThemeChoice />

      <View style={styles.leaving}>
        <Button tone="ghost" icon={Server} isWide onPress={onElsewhere}>
          {say('common.useADifferentServer')}
        </Button>

        <Button tone="ghost" icon={DoorOpen} isWide isDestructive onPress={onOut}>
          {say('common.signOut')}
        </Button>
      </View>

      <View style={styles.about}>
        {isDemo ? (
          <Words size="small" tone="muted">
            {say('common.thisIsASharedDemoAccount')}
          </Words>
        ) : null}

        {address === null ? null : (
          <Words size="small" tone="muted">
            {say('common.watchingOnAddress', { address })}
          </Words>
        )}

        {builds === null ? null : (
          <Words size="small" tone="muted">
            {builds}
          </Words>
        )}

        {reportsFeatures === false ? (
          <Words size="small" tone="muted">
            {say('client.about.someFeaturesNeedANewerServer')}
          </Words>
        ) : null}
      </View>
    </Screen>
  );
};

TheAccount.displayName = 'TheAccount';

export { TheAccount };
