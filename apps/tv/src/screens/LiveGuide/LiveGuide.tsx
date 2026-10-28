import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { useLiveWindow } from '@ValenceClient/live/useLiveWindow';
import { favouritesFirst } from '@ValenceClient/live/favouritesFirst';
import { useKeepLiveChannel } from '@ValenceClient/live/useKeepLiveChannel';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { useRemote } from '@ValenceTv/remote/useRemote';
import { useTheScreen } from '@ValenceTv/platform/useTheScreen';
import { tokens } from '@ValenceTv/theme/tokens';
import {
  CELL_GAP,
  CHANNEL_WIDTH,
  GuideRow,
} from '@ValenceTv/screens/LiveGuide/components/GuideRow/GuideRow';
import { TimeBar } from '@ValenceTv/screens/LiveGuide/components/TimeBar/TimeBar';
import type { HWEvent } from 'react-native';
import type { GuideCell } from '@ValenceClient/live/guideCellsOf';
import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';
import type { LiveGuideProps } from './LiveGuide.types';
import { say } from '@ValenceI18n/say';

const HOUR_MS = 60 * 60 * 1000;

const SHOWN_MS = 2 * HOUR_MS;

const STEP_MS = HOUR_MS;

const FURTHEST_STEPS = 22;

const ROW_HEIGHT = 104;

const ROW_GAP = 12;

const SAME_PRESS_MS = 150;

const NOTHING: readonly LiveProgramme[] = [];

type Landed = { channelId: string; startsAt: number; endsAt: number; isTop: boolean; at: number };

/**
 * The stretch of the guide starting a number of steps on from the half hour now.
 *
 * @param from - The half hour now, in milliseconds.
 * @param steps - How many steps on.
 * @returns The stretch's ends, in milliseconds and as the guide is asked for them.
 */
const stretchOf = (from: number, steps: number) => {
  const starts = from + steps * STEP_MS;
  const ends = starts + SHOWN_MS;

  return {
    starts,
    ends,
    asked: liveQueries.guide(new Date(starts).toISOString(), new Date(ends).toISOString()),
  };
};

/**
 * The live TV guide, as a television's own guide is: a row for each channel, favourites first, with
 * its programmes laid across the next two hours, the one on now lit and a line at this minute. Up and
 * down move between channels and left and right between programmes; pressing on past either end
 * moves the guide an hour, never before the half hour now and never more than a day on. Choosing a
 * programme watches its channel, and holding it adds the channel to favourites or takes it off.
 *
 * @param onWatch - Told which channel to watch.
 * @param upTo - The tab this page belongs under, which pressing up from the top row goes to.
 * @param cameBackTo - The channel last watched, once the player has closed, which the guide goes
 *   back to now and sends the remote to.
 * @param isCovered - Whether something is drawn over the guide, so the remote is not its to hear.
 */
const LiveGuidePage = ({ onWatch, upTo, cameBackTo, isCovered }: LiveGuideProps) => {
  const { from: halfHourNow, now } = useLiveWindow();
  const [steps, setSteps] = useState(0);
  const { starts, ends, asked } = stretchOf(halfHourNow, steps);
  const guide = useQuery(asked);
  const cache = useQueryClient();
  const screen = useTheScreen();
  const width = screen.width - tokens.space.edge * 2 - CHANNEL_WIDTH - CELL_GAP;
  const { arrive, leave: leaveTheTop } = useHandOff('up', isCovered ? null : upTo);
  const landed = useRef<Landed | null>(null);
  const [aim, setAim] = useState<{ channelId: string; at: number } | null>(null);
  const list = useRef<FlatList<LiveChannel>>(null);
  const channelsNow = useRef<readonly LiveChannel[]>([]);

  useEffect(() => {
    if (steps < FURTHEST_STEPS) {
      void cache.prefetchQuery(stretchOf(halfHourNow, steps + 1).asked);
    }
  }, [cache, halfHourNow, steps]);

  const [kept, setKept] = useState<{ channelId: string; at: number; isKept: boolean } | null>(null);
  const keepChannel = useKeepLiveChannel(
    useCallback(() => {
      setKept(null);
      Alert.alert(say('common.liveTv'), say('screens.liveTvPage.thatCouldNotBeKept'));
    }, []),
  );

  const keep = useCallback(
    (channel: LiveChannel) => {
      keepChannel(channel);
      setKept({
        channelId: channel.id,
        at: landed.current?.startsAt ?? Date.now(),
        isKept: !channel.isFavourite,
      });
    },
    [keepChannel],
  );

  const channels = useMemo(() => favouritesFirst(guide.data?.channels ?? []), [guide.data]);
  const byChannel = useMemo(() => {
    const held = new Map<string, LiveProgramme[]>();

    for (const programme of guide.data?.programmes ?? []) {
      const list = held.get(programme.channelId);

      if (list === undefined) {
        held.set(programme.channelId, [programme]);
      } else {
        list.push(programme);
      }
    }

    return held;
  }, [guide.data]);

  useEffect(() => {
    channelsNow.current = channels;
  }, [channels]);

  useEffect(() => {
    if (cameBackTo === null) {
      return;
    }

    const index = channelsNow.current.findIndex((one) => one.id === cameBackTo.channelId);

    if (index === -1) {
      return;
    }

    setSteps(0);
    list.current?.scrollToIndex({ index, viewPosition: 0.4, animated: false });
    setAim({ channelId: cameBackTo.channelId, at: Date.now() });
  }, [cameBackTo]);

  useEffect(() => {
    if (kept === null) {
      return;
    }

    const index = channels.findIndex((one) => one.id === kept.channelId);

    if (index !== -1 && channels[index]?.isFavourite !== kept.isKept) {
      return;
    }

    setKept(null);

    if (index === -1) {
      return;
    }

    list.current?.scrollToIndex({ index, viewPosition: 0.4, animated: false });
    setAim({ channelId: kept.channelId, at: kept.at });
  }, [kept, channels]);

  useEffect(() => {
    if (isCovered) {
      landed.current = null;
      leaveTheTop();
    }
  }, [isCovered, leaveTheTop]);

  const watch = useCallback(
    (channel: LiveChannel) => {
      onWatch(channel.id);
    },
    [onWatch],
  );

  const land = useCallback(
    (channel: LiveChannel, cell: GuideCell) => {
      const isTop = channels[0]?.id === channel.id;

      landed.current = {
        channelId: channel.id,
        startsAt: cell.startsAt,
        endsAt: cell.endsAt,
        isTop,
        at: Date.now(),
      };

      if (isTop) {
        arrive();
      } else {
        leaveTheTop();
      }
    },
    [channels, arrive, leaveTheTop],
  );

  const leave = useCallback((channel: LiveChannel, cell: GuideCell) => {
    const was = landed.current;

    if (was?.channelId === channel.id && was.startsAt === cell.startsAt) {
      landed.current = null;
    }
  }, []);

  const aimed = useCallback(() => {
    setAim(null);
  }, []);

  const hear = useCallback(
    (event: HWEvent) => {
      const was = landed.current;

      if (isCovered || was === null || Date.now() - was.at < SAME_PRESS_MS) {
        return;
      }

      if (event.eventType === 'right' && was.endsAt >= ends && steps < FURTHEST_STEPS) {
        setSteps(steps + 1);
        setAim({ channelId: was.channelId, at: ends });
      }

      if (event.eventType === 'left' && was.startsAt <= starts && steps > 0) {
        setSteps(steps - 1);
        setAim({ channelId: was.channelId, at: starts - 1 });
      }
    },
    [isCovered, starts, ends, steps],
  );

  useRemote(hear);

  if (guide.isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (channels.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>{say('screens.liveTvPage.noLiveChannelsYet')}</Text>
      </View>
    );
  }

  const isAiming = aim !== null && !guide.isPlaceholderData;
  const nowAt = now >= starts && now < ends ? ((now - starts) / (ends - starts)) * width : null;

  return (
    <View style={styles.page}>
      <View style={styles.head}>
        <Text style={styles.title}>{say('common.liveTv')}</Text>
        <Text style={styles.hint}>{say('tv.liveGuide.holdToKeep')}</Text>
      </View>

      <View style={styles.times}>
        <TimeBar from={starts} until={ends} width={width} nowAt={nowAt} />
      </View>

      <FocusGuide trapsLeft trapsRight style={styles.grid}>
        {nowAt === null ? null : (
          <View
            pointerEvents="none"
            style={[styles.nowLine, { left: tokens.space.edge + CHANNEL_WIDTH + CELL_GAP + nowAt }]}
          />
        )}

        <FlatList
          ref={list}
          data={channels}
          keyExtractor={(channel) => channel.id}
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT + ROW_GAP,
            offset: (ROW_HEIGHT + ROW_GAP) * index,
            index,
          })}
          initialNumToRender={8}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.inside}
          renderItem={({ item }) => (
            <View style={styles.rowFrame}>
              <GuideRow
                channel={item}
                programmes={byChannel.get(item.id) ?? NOTHING}
                from={starts}
                until={ends}
                width={width}
                now={now}
                aimAt={isAiming && aim.channelId === item.id ? aim.at : null}
                onAimed={aimed}
                onWatch={watch}
                onKeep={keep}
                onLand={land}
                onLeave={leave}
              />
            </View>
          )}
        />
      </FocusGuide>
    </View>
  );
};

const LiveGuide = memo(LiveGuidePage);

LiveGuide.displayName = 'LiveGuide';

const styles = StyleSheet.create({
  page: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: tokens.space.lg,
    paddingHorizontal: tokens.space.edge,
    marginBottom: tokens.space.sm,
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  hint: { flexShrink: 1, color: tokens.colours.muted, fontSize: tokens.type.small },
  times: {
    paddingLeft: tokens.space.edge + CHANNEL_WIDTH + CELL_GAP,
    marginBottom: tokens.space.xs,
  },
  grid: { flex: 1 },
  inside: { paddingHorizontal: tokens.space.edge, paddingBottom: tokens.space.xl },
  rowFrame: { height: ROW_HEIGHT, marginBottom: ROW_GAP },
  nowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: tokens.colours.accent,
  },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { LiveGuide };
