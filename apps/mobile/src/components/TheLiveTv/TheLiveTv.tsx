import { Broadcast, Search } from '@keyline-icons/react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AFilterChips } from '@ValenceMobile/components/AFilterChips/AFilterChips';
import { ALivePlayer } from '@ValenceMobile/components/ALivePlayer/ALivePlayer';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { AChannelRow } from '@ValenceMobile/components/TheLiveTv/components/AChannelRow/AChannelRow';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { groupsOf } from '@ValenceClient/live/groupsOf';
import { LIVE_SHOWING } from '@ValenceClient/live/LIVE_SHOWING';
import { narrowLiveChannels } from '@ValenceClient/live/narrowLiveChannels';
import { onNowAndNext } from '@ValenceClient/live/onNowAndNext';
import { useKeepLiveChannel } from '@ValenceClient/live/useKeepLiveChannel';
import { useLiveWindow } from '@ValenceClient/live/useLiveWindow';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import type { TheLiveTvProps } from './TheLiveTv.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  list: { paddingBottom: 140, paddingHorizontal: 20 },
  search: { paddingBottom: 6, paddingHorizontal: 20 },
  waiting: { paddingVertical: 60 },
});

/**
 * Says a channel could not be kept as a favourite.
 */
const failedToKeep = () => {
  Alert.alert(say('screens.liveTvPage.thatCouldNotBeKept'));
};

/**
 * Live TV on the phone: every channel the server carries, each with what it is showing now, how far
 * through it is and what follows, narrowed to favourites, to those on air or to one group, and
 * searched loosely the way the web searches it. A channel plays over the whole screen, turned
 * sideways, and up and down there move along the list as a remote would.
 *
 * @param header - What sits above it, which the library draws.
 * @param onScrolled - Told whether it has been scrolled from its top.
 */
const TheLiveTv = ({ header, onScrolled }: TheLiveTvProps) => {
  const colours = useTheColours();
  const { from, until, now } = useLiveWindow();
  const query = liveQueries.guide(new Date(from).toISOString(), new Date(until).toISOString());
  const guide = useQuery(query);
  const [showing, setShowing] = useState<string>(LIVE_SHOWING.all);
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const toggleFavourite = useKeepLiveChannel(query.queryKey, failedToKeep);
  const channels = useMemo(() => guide.data?.channels ?? [], [guide.data]);
  const programmes = guide.data?.programmes ?? [];
  const groups = useMemo(
    () =>
      [...new Set(channels.flatMap((channel) => groupsOf(channel.group)))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [channels],
  );
  const shown = narrowLiveChannels(channels, showing, search);
  const at = shown.findIndex((channel) => channel.id === playing);
  const chosen =
    at === -1 ? (channels.find((channel) => channel.id === playing) ?? null) : shown[at];
  const close = useCallback(() => {
    setPlaying(null);
  }, []);

  const chips = [
    { id: LIVE_SHOWING.all, label: say('screens.liveTvPage.allChannels') },
    { id: LIVE_SHOWING.onAir, label: say('screens.liveTvPage.onAirNow') },
    { id: LIVE_SHOWING.favourites, label: say('common.favourites') },
    ...groups.map((group) => ({ id: group, label: group })),
  ];

  return (
    <Screen scrolls isSeeThrough {...(onScrolled === undefined ? {} : { onScrolled })}>
      {header}

      <View style={styles.search}>
        <TextField
          label={say('screens.liveTvPage.findAChannel')}
          isLabelHidden
          placeholder={say('screens.liveTvPage.findAChannel')}
          keyboard="search"
          value={search}
          onValueChange={setSearch}
          action={{
            icon: Search,
            label: say('screens.liveTvPage.findAChannel'),
            onPress: () => undefined,
          }}
        />
      </View>

      <AFilterChips
        label={say('screens.liveTvPage.whichChannels')}
        chips={chips}
        value={showing}
        onSelect={setShowing}
      />

      {guide.isPending ? (
        <View style={styles.waiting}>
          <ActivityIndicator color={colours.textMuted} />
        </View>
      ) : channels.length === 0 ? (
        <ANothingHere
          of={Broadcast}
          title={say('common.liveTv')}
          detail={say('screens.liveTvPage.noChannelsYet')}
        />
      ) : shown.length === 0 && showing === LIVE_SHOWING.favourites ? (
        <ANothingHere
          of={Broadcast}
          title={say('common.favourites')}
          detail={say('screens.liveTvPage.noFavouritesYet')}
        />
      ) : (
        <View style={styles.list}>
          {shown.map((channel) => {
            const { onNow, upNext } = onNowAndNext(programmes, channel.id, now);

            return (
              <AChannelRow
                key={channel.id}
                channel={channel}
                onNow={onNow}
                upNext={upNext}
                now={now}
                onWatch={() => {
                  setPlaying(channel.id);
                }}
                onToggleFavourite={() => {
                  toggleFavourite(channel);
                }}
              />
            );
          })}
        </View>
      )}

      {chosen === null || chosen === undefined ? null : (
        <ALivePlayer
          channel={chosen}
          {...onNowAndNext(programmes, chosen.id, now)}
          now={now}
          onPrevious={
            at > 0
              ? () => {
                  setPlaying(shown[at - 1]?.id ?? null);
                }
              : undefined
          }
          onNext={
            at !== -1 && at < shown.length - 1
              ? () => {
                  setPlaying(shown[at + 1]?.id ?? null);
                }
              : undefined
          }
          onToggleFavourite={() => {
            toggleFavourite(chosen);
          }}
          onClose={close}
        />
      )}
    </Screen>
  );
};

TheLiveTv.displayName = 'TheLiveTv';

export { TheLiveTv };
