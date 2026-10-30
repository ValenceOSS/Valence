import { Broadcast, Search } from '@keyline-icons/react-native';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { useQuery } from '@tanstack/react-query';
import { AFilterChips } from '@ValenceMobile/components/AFilterChips/AFilterChips';
import { ALivePlayer } from '@ValenceMobile/components/ALivePlayer/ALivePlayer';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { AChannelRow } from '@ValenceMobile/components/TheLiveTv/components/AChannelRow/AChannelRow';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { groupsOf } from '@ValenceClient/live/groupsOf';
import { LIVE_SHOWING } from '@ValenceClient/live/LIVE_SHOWING';
import { narrowLiveChannels } from '@ValenceClient/live/narrowLiveChannels';
import { onNowAndNext } from '@ValenceClient/live/onNowAndNext';
import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';
import { useKeepLiveChannel } from '@ValenceClient/live/useKeepLiveChannel';
import { useLiveWindow } from '@ValenceClient/live/useLiveWindow';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import type { TheLiveTvProps } from './TheLiveTv.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const SCROLLED = 4;

const FIRST_SCREENFUL = 12;

const A_BATCH = 10;

const SCREENFULS_KEPT = 7;

const ROOM_FOR_THE_TABS = 120;

const NO_PROGRAMMES: readonly LiveProgramme[] = [];

const styles = StyleSheet.create({
  between: { height: 10 },
  head: { gap: 14, paddingBottom: 14 },
  list: { paddingHorizontal: SCREEN_EDGE },
  waiting: { paddingVertical: 60 },
  whole: { flex: 1 },
});

/**
 * The guide's programmes by the channel each is on, so a row finds its own without reading the whole
 * guide again.
 *
 * @param programmes - Every programme in the guide.
 * @returns Each channel's programmes.
 */
const byChannel = (programmes: readonly LiveProgramme[]) => {
  const found = new Map<string, LiveProgramme[]>();

  for (const programme of programmes) {
    const already = found.get(programme.channelId);

    if (already === undefined) {
      found.set(programme.channelId, [programme]);
    } else {
      already.push(programme);
    }
  }

  return found;
};

/**
 * What a channel is known by in the list.
 *
 * @param channel - The channel.
 * @returns Its key.
 */
const keyOfChannel = (channel: LiveChannel) => channel.id;

/**
 * Says a channel could not be kept as a favourite.
 */
const failedToKeep = () => {
  Alert.alert(say('screens.liveTvPage.thatCouldNotBeKept'));
};

/**
 * The room between two channels in the list.
 */
const Between = () => <View style={styles.between} />;

/**
 * Live TV on the phone: every channel the server carries, each with what it is showing now, how far
 * through it is and what follows, narrowed to favourites, to those on air or to one group, and
 * searched loosely the way the web searches it. The list draws only the channels near the screen,
 * since a server can carry thousands, and each row finds its own programmes from the guide read
 * once by channel. A channel plays over the whole screen, turned sideways, and up and down there
 * move along the list as a remote would.
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
  const toggleFavourite = useKeepLiveChannel(failedToKeep);
  const channels = useMemo(() => guide.data?.channels ?? [], [guide.data]);
  const programmes = guide.data?.programmes ?? NO_PROGRAMMES;
  const room = useSafeAreaInsets();
  const wasScrolled = useRef<boolean | null>(null);
  const onChannel = useMemo(() => byChannel(programmes), [programmes]);
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
  const watch = useCallback((channelId: string) => {
    setPlaying(channelId);
  }, []);
  const told = useRef({ toggleFavourite });

  useLayoutEffect(() => {
    told.current.toggleFavourite = toggleFavourite;
  });

  const keep = useCallback((channel: LiveChannel) => {
    told.current.toggleFavourite(channel);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: LiveChannel }) => {
      const { onNow, upNext } = onNowAndNext(onChannel.get(item.id) ?? NO_PROGRAMMES, item.id, now);

      return (
        <AChannelRow
          channel={item}
          onNow={onNow}
          upNext={upNext}
          now={now}
          onWatch={watch}
          onToggleFavourite={keep}
        />
      );
    },
    [onChannel, now, watch, keep],
  );

  const onScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const isScrolled = nativeEvent.contentOffset.y > SCROLLED;

      if (isScrolled !== wasScrolled.current) {
        wasScrolled.current = isScrolled;
        onScrolled?.(isScrolled);
      }
    },
    [onScrolled],
  );

  const chips = [
    { id: LIVE_SHOWING.all, label: say('screens.liveTvPage.allChannels') },
    { id: LIVE_SHOWING.onAir, label: say('screens.liveTvPage.onAirNow') },
    { id: LIVE_SHOWING.favourites, label: say('common.favourites') },
    ...groups.map((group) => ({ id: group, label: group })),
  ];

  const head = (
    <View style={styles.head}>
      {header}

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

      <AFilterChips
        label={say('screens.liveTvPage.whichChannels')}
        chips={chips}
        value={showing}
        onSelect={setShowing}
      />
    </View>
  );

  const empty = guide.isPending ? (
    <View style={styles.waiting}>
      <ASpinner colour={colours.textMuted} />
    </View>
  ) : channels.length === 0 ? (
    <ANothingHere
      of={Broadcast}
      title={say('screens.liveTvPage.noLiveChannelsYet')}
      detail={say('screens.liveTvPage.noChannelsAndHowToAddThem')}
    />
  ) : showing === LIVE_SHOWING.favourites ? (
    <ANothingHere
      of={Broadcast}
      title={say('common.favourites')}
      detail={say('screens.liveTvPage.noFavouritesYet')}
    />
  ) : null;

  return (
    <View style={styles.whole}>
      <FlatList
        data={guide.isPending ? [] : shown}
        keyExtractor={keyOfChannel}
        renderItem={renderItem}
        initialNumToRender={FIRST_SCREENFUL}
        maxToRenderPerBatch={A_BATCH}
        windowSize={SCREENFULS_KEPT}
        removeClippedSubviews
        ListHeaderComponent={head}
        {...(empty === null ? {} : { ListEmptyComponent: empty })}
        ItemSeparatorComponent={Between}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: room.bottom + ROOM_FOR_THE_TABS, paddingTop: room.top + SCREEN_EDGE },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
      />

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
    </View>
  );
};

TheLiveTv.displayName = 'TheLiveTv';

export { TheLiveTv };
