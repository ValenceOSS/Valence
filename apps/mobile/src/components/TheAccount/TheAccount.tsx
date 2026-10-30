import { switchProfile } from '@ValenceClient/profiles/switchProfile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { UserPen } from '@keyline-icons/react-native';
import {
  Download,
  EyeOff,
  History,
  Inbox,
  LaptopSmartphone,
  Link,
  LogOut,
  MessageSquarePlus,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from '@keyline-icons/react-native/fill';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { isAskedFor } from '@ValenceContracts/functions/isAskedFor';
import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';
import { describeTheServer } from '@ValenceClient/about/describeTheServer';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { AnAccountRow } from '@ValenceMobile/components/AnAccountRow/AnAccountRow';
import { AThemeChoice } from '@ValenceMobile/components/AThemeChoice/AThemeChoice';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useAccountPanels } from '@ValenceMobile/components/TheAccount/useAccountPanels';
import { ACCOUNT_PANELS } from '@ValenceMobile/components/TheAccount/ACCOUNT_PANELS';
import { AnAccountTile } from '@ValenceMobile/components/TheAccount/components/AnAccountTile/AnAccountTile';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheAccountProps } from './TheAccount.types';
import { say } from '@ValenceI18n/say';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

const styles = StyleSheet.create({
  about: { alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingTop: 4 },
  me: { alignItems: 'center', gap: 14, paddingTop: 4 },
  meName: { alignItems: 'center', gap: 2 },
  out: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 14 },
  pills: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  tile: { flex: 1 },
  tiles: { borderRadius: 20, flexDirection: 'row', overflow: 'hidden' },
  tilesLine: { alignSelf: 'stretch', marginVertical: 14, width: StyleSheet.hairlineWidth },
});

/**
 * The account, opened as a card from its tab and laid out as the phone's own settings are: a card of who is watching that opens
 * their profile, then their own things — downloads, what they have asked for and the inbox — as
 * three solid cards saying how each stands, then the rest of the account in grouped lists with a
 * coloured square for each row, the look, and the server in use with the ways out. Each part rises
 * into place a moment after the one above it.
 *
 * @param onOut - Told to sign out.
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onOpen - Told to open one part of the account, by its panel id.
 * @param onDownloads - Told to open what is kept on this phone.
 * @param onRequests - Told to open what has been asked for, where this account may ask.
 * @param onInbox - Told to open what the server has told this account.
 * @param onBack - Told somebody is done with it.
 */
const TheAccount = ({
  onOut,
  onElsewhere,
  onOpen,
  onDownloads,
  onRequests,
  onInbox,
  onBack,
}: TheAccountProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;
  const watching = useQuery(profileQueries.watching());
  const server = useQuery(aboutQueries.server());
  const inbox = useQuery(notificationQueries.inbox());
  const requests = useQuery({
    ...requestsQueries.mediaRequests(),
    enabled: onRequests !== undefined,
  });
  const held = useHeldFiles();
  const reportsFeatures = useServerHas('server.reportsFeatures');
  const { isDemo } = useWhatIMayDo();
  const panels = useAccountPanels();
  const pluginPanels = panels.filter((panel) =>
    ACCOUNT_PANELS.every((ours) => ours.id !== panel.id),
  );
  const address = platformInUse().serverAddress();
  const builds = describeTheBuild(theBuildInfo(), null);
  const serverRuns = describeTheServer(server.data ?? null);
  const profile = watching.data ?? null;
  const cache = useQueryClient();
  const household = useQuery(profileQueries.list());
  const canSwitch =
    useServerHas('profiles.chosenPerSession') === true &&
    (household.data?.profiles.length ?? 0) > 1;
  const unread = inbox.data?.unread ?? 0;
  const asked = (requests.data ?? []).filter(isAskedFor).length;
  const cardColour = isDark ? '#1c1c1e' : '#ffffff';

  const line = isDark ? 'rgba(255, 255, 255, 0.1)' : colours.border;
  const tiles = [
    { icon: Download, says: say('common.downloads'), figure: held.length, onPress: onDownloads },
    ...(onRequests === undefined
      ? []
      : [
          {
            icon: MessageSquarePlus,
            says: say('common.requests'),
            figure: asked,
            onPress: onRequests,
          },
        ]),
    {
      icon: Inbox,
      says: say('phone.theAccount.inbox'),
      figure: unread,
      isNews: unread > 0,
      onPress: onInbox,
    },
  ];

  return (
    <Screen scrolls onBack={onBack}>
      {profile === null ? (
        <Words size="title">{say('common.account')}</Words>
      ) : (
        <ARising>
          <View style={styles.me}>
            <AFace profile={profile} isLarge />
            <View style={styles.meName}>
              <Words size="title" isCentred lines={1}>
                {profile.name}
              </Words>
            </View>
            <View style={styles.pills}>
              <Button
                tone="ghost"
                icon={UserPen}
                onPress={() => {
                  onOpen('profile');
                }}
              >
                {say('phone.theAccount.editProfile')}
              </Button>
              {canSwitch ? (
                <Button
                  tone="ghost"
                  icon={Users}
                  onPress={() => {
                    void switchProfile(cache);
                  }}
                >
                  {say('screens.appShell.switchProfile')}
                </Button>
              ) : null}
            </View>
          </View>
        </ARising>
      )}

      <ARising turn={1}>
        <View style={[styles.tiles, { backgroundColor: cardColour }]}>
          {tiles.map((tile, at) => (
            <Fragment key={tile.says}>
              {at === 0 ? null : <View style={[styles.tilesLine, { backgroundColor: line }]} />}
              <View style={styles.tile}>
                <AnAccountTile
                  icon={tile.icon}
                  says={tile.says}
                  figure={tile.figure}
                  isNews={tile.isNews === true}
                  onPress={tile.onPress}
                />
              </View>
            </Fragment>
          ))}
        </View>
      </ARising>

      {isDemo || profile?.isOwner === false ? null : (
        <ARising turn={2}>
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
              icon={LaptopSmartphone}
              says={say('common.devices')}
              detail={say('phone.theAccount.devicesDetail')}
              onPress={() => {
                onOpen('devices');
              }}
            />
          </AGroup>
        </ARising>
      )}

      <ARising turn={3}>
        <AGroup title={say('phone.theAccount.watchingAndSharing')}>
          <AnAccountRow
            icon={History}
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
      </ARising>

      {pluginPanels.length === 0 ? null : (
        <ARising turn={4}>
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
        </ARising>
      )}

      <ARising turn={5}>
        <AThemeChoice />
      </ARising>

      <ARising turn={6}>
        <AGroup title={say('common.server')}>
          <AnAccountRow
            icon={Server}
            says={say('common.useADifferentServer')}
            {...(address === null ? {} : { detail: address })}
            onPress={onElsewhere}
          />
          <Button tone="bare" label={say('common.signOut')} onPress={onOut}>
            <View style={styles.out}>
              <Icon of={LogOut} colour={colours.danger} size={18} />
              <Words tone="danger">{say('common.signOut')}</Words>
            </View>
          </Button>
        </AGroup>
      </ARising>

      <View style={styles.about}>
        {isDemo ? (
          <Words size="small" tone="muted" isCentred>
            {say('common.thisIsASharedDemoAccount')}
          </Words>
        ) : null}

        {builds === null ? null : (
          <Words size="small" tone="muted" isCentred>
            {builds}
          </Words>
        )}

        {serverRuns === null ? null : (
          <Words size="small" tone="muted" isCentred>
            {serverRuns}
          </Words>
        )}

        {reportsFeatures === false ? (
          <Words size="small" tone="muted" isCentred>
            {say('client.about.someFeaturesNeedANewerServer')}
          </Words>
        ) : null}
      </View>
    </Screen>
  );
};

TheAccount.displayName = 'TheAccount';

export { TheAccount };
