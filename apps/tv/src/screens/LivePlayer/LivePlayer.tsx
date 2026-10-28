import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useQuery } from '@tanstack/react-query';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { useLiveWindow } from '@ValenceClient/live/useLiveWindow';
import { favouritesFirst } from '@ValenceClient/live/favouritesFirst';
import { onNowAndNext } from '@ValenceClient/live/onNowAndNext';
import { watchLiveChannel } from '@ValenceClient/live/watchLiveChannel';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { useRemote } from '@ValenceTv/remote/useRemote';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import type { LiveChannel } from '@ValenceContracts/schemas/LiveTv';
import { videoFill } from '@ValenceTv/theme/videoFill';
import { tokens } from '@ValenceTv/theme/tokens';
import { NowAndNext } from '@ValenceTv/screens/LivePlayer/components/NowAndNext/NowAndNext';
import type { HWEvent } from 'react-native';
import type { LivePlayerProps } from './LivePlayer.types';
import { say } from '@ValenceI18n/say';

const TUNES_AFTER_MS = 600;

const SHOWN_FOR_MS = 5000;

const GIVES_UP_AFTER_MS = 20_000;

const FADES_MS = 220;

type Tuning = { kind: 'starting' } | { kind: 'playing' } | { kind: 'problem'; message: string };

type Tuned = { channelId: string; tuning: Tuning };

/**
 * A live channel, filling the screen. Up and down change channel, through the same channels in the
 * same order as the guide, favourites first; the channel shown changes at once and the stream follows
 * once the remote rests, so flicking through channels does not start a stream for each. What is on
 * now and next is shown over the picture each time the channel changes, and whenever the remote is
 * pressed, and fades after a few seconds. Play/pause pauses the picture. Menu puts the details away,
 * and then goes back to the guide.
 *
 * The screen holds the remote itself, so the guide's programme left behind it is not pressed again
 * or held, and a channel the guide stops listing while it is watched stays named and can still be
 * stepped away from. Nothing the player reports counts until the stream it is about has been put
 * in, so news of a stream it has since been told to leave is not taken as news of the next.
 *
 * @param channelId - The channel chosen in the guide.
 * @param onLeave - Told to go back to the guide, with the channel last watched.
 * @param onShowing - Told each channel shown, for going back to the guide from outside the player.
 */
const LivePlayer = ({ channelId, onLeave, onShowing }: LivePlayerProps) => {
  const { from, until, now } = useLiveWindow();
  const guide = useQuery(
    liveQueries.guide(new Date(from).toISOString(), new Date(until).toISOString()),
  );
  const channels = useMemo(() => favouritesFirst(guide.data?.channels ?? []), [guide.data]);
  const [showing, setShowing] = useState(channelId);
  const [tuned, setTuned] = useState(channelId);
  const [state, setState] = useState<Tuned>({ channelId, tuning: { kind: 'starting' } });
  const [isUp, setIsUp] = useState(true);
  const hides = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStill = useKeepsStill();
  const [shown] = useState(() => new Animated.Value(1));
  const player = useVideoPlayer(null);
  const loaded = useRef<string | null>(null);
  const [lastKnown, setLastKnown] = useState<{ channel: LiveChannel; at: number } | null>(null);

  const at = channels.findIndex((one) => one.id === showing);
  const found = channels[at] ?? null;
  const channel = found ?? (lastKnown?.channel.id === showing ? lastKnown.channel : null);

  useEffect(() => {
    if (found !== null) {
      setLastKnown((was) =>
        was?.channel === found && was.at === at ? was : { channel: found, at },
      );
    }
  }, [found, at]);
  useEffect(() => {
    onShowing(showing);
  }, [onShowing, showing]);

  const { onNow, upNext } = onNowAndNext(guide.data?.programmes ?? [], showing, now);

  const touch = useCallback(() => {
    setIsUp(true);

    if (hides.current !== null) {
      clearTimeout(hides.current);
    }

    hides.current = setTimeout(() => {
      setIsUp(false);
    }, SHOWN_FOR_MS);
  }, []);

  useEffect(() => {
    touch();

    return () => {
      if (hides.current !== null) {
        clearTimeout(hides.current);
      }
    };
  }, [touch]);

  const tuning: Tuning = showing === state.channelId ? state.tuning : { kind: 'starting' };
  const isHeld = isUp || tuning.kind !== 'playing';

  useEffect(() => {
    Animated.timing(shown, {
      toValue: isHeld ? 1 : 0,
      duration: isStill ? 0 : FADES_MS,
      useNativeDriver: true,
    }).start();
  }, [isHeld, isStill, shown]);

  useEffect(() => {
    if (showing === tuned) {
      return;
    }

    const settles = setTimeout(() => {
      setTuned(showing);
    }, TUNES_AFTER_MS);

    return () => {
      clearTimeout(settles);
    };
  }, [showing, tuned]);

  const arrive = useCallback(() => {
    setState((was) =>
      loaded.current === null || was.channelId !== loaded.current || was.tuning.kind === 'playing'
        ? was
        : { ...was, tuning: { kind: 'playing' } },
    );
  }, []);

  useEffect(() => {
    let isGone = false;

    setState({ channelId: tuned, tuning: { kind: 'starting' } });
    loaded.current = null;
    player.pause();

    const giveUp = (message: string) => {
      setState({ channelId: tuned, tuning: { kind: 'problem', message } });
      void player.replaceAsync(null);
    };

    void watchLiveChannel(tuned)
      .then((sent) => {
        if (isGone) {
          return;
        }

        const stream = sent.value;

        if (stream === null) {
          giveUp(sent.refusal?.message ?? say('screens.liveTvPage.thatChannelCouldNotBePlayed'));

          return;
        }

        if ('embedUrl' in stream) {
          giveUp(say('tv.livePlayer.playsOnAComputerOrPhone'));

          return;
        }

        void player
          .replaceAsync({
            uri: onTheServer(stream.manifestUrl),
            headers: signedHeaders(),
            contentType: 'hls',
          })
          .then(() => {
            if (isGone) {
              return;
            }

            loaded.current = tuned;
            player.play();

            if (player.status === 'readyToPlay' || player.playing) {
              arrive();
            }
          })
          .catch(() => {
            if (!isGone) {
              giveUp(say('screens.liveTvPage.thatChannelCouldNotBePlayed'));
            }
          });
      })
      .catch(() => {
        if (!isGone) {
          giveUp(say('screens.liveTvPage.thatChannelCouldNotBePlayed'));
        }
      });

    const waited = setTimeout(() => {
      if (!isGone) {
        setState((was) =>
          was.channelId === tuned && was.tuning.kind === 'starting'
            ? {
                channelId: tuned,
                tuning: { kind: 'problem', message: say('screens.liveTvPage.itSentNoPictures') },
              }
            : was,
        );
      }
    }, GIVES_UP_AFTER_MS);

    return () => {
      isGone = true;
      clearTimeout(waited);
    };
  }, [arrive, player, tuned]);

  useEffect(() => {
    const isTheirs = (was: Tuned) => loaded.current !== null && was.channelId === loaded.current;

    const listening = [
      player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay') {
          arrive();
        }

        if (status === 'error') {
          setState((was) =>
            isTheirs(was)
              ? {
                  ...was,
                  tuning: {
                    kind: 'problem',
                    message: say('screens.liveTvPage.thatChannelCouldNotBePlayed'),
                  },
                }
              : was,
          );
        }
      }),
      player.addListener('playingChange', ({ isPlaying }) => {
        if (isPlaying) {
          arrive();
        }
      }),
    ];

    return () => {
      for (const one of listening) {
        one.remove();
      }
    };
  }, [arrive, player]);

  const move = useCallback(
    (by: number) => {
      const from = at === -1 ? (lastKnown?.at ?? -1) : at;

      if (channels.length < 2 || from === -1) {
        return;
      }

      const next =
        channels[(Math.min(from, channels.length - 1) + by + channels.length) % channels.length];

      if (next !== undefined) {
        setShowing(next.id);
      }
    },
    [at, channels, lastKnown],
  );

  const hear = useCallback(
    (event: HWEvent) => {
      switch (event.eventType) {
        case 'up':
          move(-1);
          touch();
          break;
        case 'down':
          move(1);
          touch();
          break;
        case 'playPause':
          if (player.playing) {
            player.pause();
          } else {
            player.play();
          }
          touch();
          break;
        case 'select':
        case 'left':
        case 'right':
          touch();
          break;
      }
    },
    [move, player, touch],
  );

  useRemote(hear);

  const putAway = useCallback(() => {
    if (hides.current !== null) {
      clearTimeout(hides.current);
    }

    setIsUp(false);
  }, []);

  const leave = useCallback(() => {
    onLeave(showing);
  }, [onLeave, showing]);

  useMenuButton(isUp && tuning.kind === 'playing' ? putAway : leave);

  return (
    <View style={styles.screen}>
      <VideoView
        player={player}
        pointerEvents="none"
        nativeControls={false}
        contentFit="contain"
        style={videoFill}
      />

      <Focusable
        label={channel === null ? say('common.liveTv') : channelTagsOf(channel.name).name}
        hasPreferredFocus
        scale={1}
        onPress={touch}
        style={StyleSheet.absoluteFill}
      >
        <View style={StyleSheet.absoluteFill} />
      </Focusable>

      {tuning.kind === 'starting' ? (
        <View style={styles.middle} pointerEvents="none">
          <ActivityIndicator size="large" color={tokens.colours.text} />
        </View>
      ) : null}

      {channel === null ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown }]} pointerEvents="none">
          <NowAndNext
            channel={channel}
            onNow={onNow}
            upNext={upNext}
            now={now}
            problem={tuning.kind === 'problem' ? tuning.message : null}
          />
        </Animated.View>
      )}
    </View>
  );
};

LivePlayer.displayName = 'LivePlayer';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  middle: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});

export { LivePlayer };
