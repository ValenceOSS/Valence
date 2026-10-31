import {
  ChevronDown,
  ChevronUp,
  Pause,
  PictureInPicture,
  Play,
  Star,
  X,
} from '@keyline-icons/react-native/fill';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AirPlayButton } from '@ValenceMobile/components/AirPlayButton/AirPlayButton';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { APlayerCircle } from '@ValenceMobile/components/Watching/components/APlayerCircle/APlayerCircle';
import { APlayerCapsule } from '@ValenceMobile/components/Watching/components/APlayerCapsule/APlayerCapsule';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { turnThisPhoneSideways } from '@ValenceMobile/platform/turnThisPhoneSideways';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';
import { watchLiveChannel } from '@ValenceClient/live/watchLiveChannel';
import type { VideoSource, VideoView as VideoViewRef } from 'expo-video';
import type { ALivePlayerProps } from './ALivePlayer.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const LEAVE_THEM_UP_FOR = 4000;

const { colours, edge } = PLAYER_LOOK;

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colours.rest,
    borderRadius: 2,
    flex: 1,
    height: 4,
    overflow: 'hidden',
  },
  clock: {
    color: colours.text,
    fontFamily: FONTS.sans.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  line: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  middle: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  middleRow: { alignItems: 'center', flexDirection: 'row', gap: 48 },
  playNudge: { marginLeft: 5 },
  barFilled: { backgroundColor: colours.text, height: '100%' },
  centre: {
    alignItems: 'center',
    bottom: 0,
    gap: 14,
    justifyContent: 'center',
    left: 0,
    padding: 40,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  foot: { gap: 8 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headEnd: { alignItems: 'center', flexDirection: 'row', gap: 10, marginLeft: 'auto' },
  icon: {
    alignItems: 'center',
    height: PLAYER_LOOK.slot,
    justifyContent: 'center',
    width: PLAYER_LOOK.slot,
  },
  live: {
    backgroundColor: '#d63b3b',
    borderRadius: 6,
    color: colours.text,
    fontFamily: FONTS.sans.bold,
    fontSize: 12,
    letterSpacing: 1,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  name: { color: colours.text, flexShrink: 1, fontFamily: FONTS.sans.bold, fontSize: 18 },
  next: { color: colours.quiet, fontFamily: FONTS.sans.semibold, fontSize: 14 },
  onNow: { color: colours.text, fontFamily: FONTS.sans.bold, fontSize: 20 },
  picture: { backgroundColor: '#000000', flex: 1 },
  said: { color: colours.text, fontFamily: FONTS.sans.semibold, fontSize: 16, textAlign: 'center' },
  whole: {
    backgroundColor: colours.scrim,
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

/**
 * One channel playing live, over the whole screen and turned sideways, through the server so the
 * provider's address and login never reach the phone.
 *
 * A tap brings up what is on, laid out as the film player lays it out and drawn with its pieces:
 * the channel and a live mark along the top, with keeping it, AirPlay and picture in picture in one
 * soft capsule and the way out on a circle of its own; the channel before, play or pause and the
 * channel after across the middle, as the film player puts its steps either side of play; and what
 * it is showing now along the foot, with when it started and ends either side of how far through it
 * is, and what follows. A channel that is a web page with its own player opens
 * in the browser, and one that will not play says why.
 *
 * @param channel - The channel.
 * @param onNow - What it is showing now, where the guide says.
 * @param upNext - What follows, where the guide says.
 * @param now - The time now.
 * @param onPrevious - Told to move to the channel before it, where there is one.
 * @param onNext - Told to move to the channel after it, where there is one.
 * @param onToggleFavourite - Told to keep it as a favourite, or let it go.
 * @param onClose - Told they are done watching.
 */
const TheLivePicture = ({
  channel,
  onNow,
  upNext,
  now,
  onPrevious,
  onNext,
  onToggleFavourite,
  onClose,
}: ALivePlayerProps) => {
  const room = useSafeAreaInsets();
  const picture = useRef<VideoViewRef | null>(null);
  const [source, setSource] = useState<VideoSource | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [areUp, setAreUp] = useState(true);
  const [touched, setTouched] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  const { name } = channelTagsOf(channel.name);

  useEffect(() => turnThisPhoneSideways(), []);

  useEffect(() => {
    let isGone = false;

    setSource(null);
    setRefusal(null);

    void watchLiveChannel(channel.id).then((sent) => {
      if (isGone) {
        return;
      }

      const stream = sent.value;

      if (stream === null) {
        setRefusal(sent.refusal?.message ?? say('screens.liveTvPage.thatChannelCouldNotBePlayed'));

        return;
      }

      if ('embedUrl' in stream) {
        void Linking.openURL(stream.embedUrl);
        onClose();

        return;
      }

      const uri = onThisServer(stream.manifestUrl);

      void theCookiesThisPhoneHolds(uri).then((cookie) => {
        if (!isGone) {
          setSource(cookie === null ? { uri } : { uri, headers: { Cookie: cookie } });
        }
      });
    });

    return () => {
      isGone = true;
    };
  }, [channel.id, onClose]);

  const player = useVideoPlayer(source, (ready) => {
    ready.showNowPlayingNotification = true;
    ready.staysActiveInBackground = true;
  });
  const status = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEventListener(player, 'sourceLoad', () => {
    player.play();
  });

  useEffect(() => {
    Animated.timing(fade, {
      toValue: areUp ? 1 : 0,
      duration: areUp ? 160 : 240,
      useNativeDriver: true,
    }).start();

    if (!areUp) {
      return undefined;
    }

    const away = setTimeout(() => {
      setAreUp(false);
    }, LEAVE_THEM_UP_FOR);

    return () => {
      clearTimeout(away);
    };
  }, [areUp, fade, touched]);

  const keepThemUp = () => {
    setAreUp(true);
    setTouched(Date.now());
  };

  const through =
    onNow === null
      ? null
      : Math.min(
          1,
          Math.max(
            0,
            (now - Date.parse(onNow.startsAt)) /
              Math.max(1, Date.parse(onNow.endsAt) - Date.parse(onNow.startsAt)),
          ),
        );
  const isWaiting = refusal === null && (source === null || status.status === 'loading');

  return (
    <View style={styles.picture}>
      {source === null ? null : (
        <VideoView
          allowsVideoFrameAnalysis={false}
          ref={picture}
          style={styles.picture}
          player={player}
          allowsPictureInPicture
          startsPictureInPictureAutomatically
          nativeControls={false}
          contentFit="contain"
        />
      )}

      <Button
        tone="bare"
        fills
        label={areUp ? say('common.hideTheControls') : say('common.showTheControls')}
        onPress={() => {
          if (areUp) {
            setAreUp(false);
          } else {
            keepThemUp();
          }
        }}
      />

      {isWaiting ? (
        <View style={styles.centre} pointerEvents="none">
          <ASpinner colour={colours.text} />
          <Text style={styles.said}>{say('screens.liveTvPage.startingName', { name })}</Text>
        </View>
      ) : null}

      {refusal === null ? null : (
        <View style={styles.centre} pointerEvents="none">
          <Text style={styles.said}>{refusal}</Text>
        </View>
      )}

      <Animated.View
        pointerEvents={areUp ? 'box-none' : 'none'}
        style={[
          styles.whole,
          {
            opacity: fade,
            paddingBottom: room.bottom + 16,
            paddingLeft: Math.max(room.left, edge),
            paddingRight: Math.max(room.right, edge),
            paddingTop: Math.max(room.top, 14),
          },
        ]}
      >
        <View style={styles.head} pointerEvents="box-none">
          <Text style={styles.live}>{say('common.live').toUpperCase()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {channel.number === null ? name : `${channel.number} · ${name}`}
          </Text>

          <View style={styles.headEnd} pointerEvents="box-none">
            <APlayerCapsule>
              <Button
                tone="bare"
                isChosen={channel.isFavourite}
                label={
                  channel.isFavourite
                    ? say('screens.liveTvPage.stopKeepingName', { name })
                    : say('screens.liveTvPage.keepName', { name })
                }
                onPress={() => {
                  keepThemUp();
                  onToggleFavourite();
                }}
              >
                <View style={styles.icon}>
                  <Icon
                    of={Star}
                    size={PLAYER_LOOK.icon}
                    colour={channel.isFavourite ? colours.played : colours.text}
                  />
                </View>
              </Button>

              <View style={styles.icon}>
                <AirPlayButton isOverPicture />
              </View>

              <Button
                tone="bare"
                label={say('screens.videoPlayer.playerControls.popOut')}
                onPress={() => {
                  void picture.current?.startPictureInPicture().catch(() => undefined);
                }}
              >
                <View style={styles.icon}>
                  <Icon of={PictureInPicture} size={PLAYER_LOOK.icon} colour={colours.text} />
                </View>
              </Button>
            </APlayerCapsule>

            <Button
              tone="bare"
              label={say('phone.watching.theControls.stopWatching')}
              onPress={onClose}
            >
              <APlayerCircle>
                <Icon of={X} size={PLAYER_LOOK.icon} colour={colours.text} />
              </APlayerCircle>
            </Button>
          </View>
        </View>

        <View style={styles.middle} pointerEvents="box-none">
          <View style={styles.middleRow} pointerEvents="box-none">
            <Button
              tone="bare"
              label={say('phone.liveTv.previousChannel')}
              isDisabled={onPrevious === undefined}
              onPress={() => {
                onPrevious?.();
              }}
            >
              <APlayerCircle size="small">
                <Icon of={ChevronUp} size={30} colour={colours.text} />
              </APlayerCircle>
            </Button>

            <Button
              tone="bare"
              label={isPlaying ? say('common.pause') : say('common.play')}
              onPress={() => {
                keepThemUp();

                if (isPlaying) {
                  player.pause();
                } else {
                  player.play();
                }
              }}
            >
              <APlayerCircle size="big">
                {isWaiting ? (
                  <ASpinner colour={colours.text} size={PLAYER_LOOK.middle} />
                ) : (
                  <View style={isPlaying ? null : styles.playNudge}>
                    <Icon
                      of={isPlaying ? Pause : Play}
                      size={PLAYER_LOOK.middle}
                      colour={colours.text}
                    />
                  </View>
                )}
              </APlayerCircle>
            </Button>

            <Button
              tone="bare"
              label={say('phone.liveTv.nextChannel')}
              isDisabled={onNext === undefined}
              onPress={() => {
                onNext?.();
              }}
            >
              <APlayerCircle size="small">
                <Icon of={ChevronDown} size={30} colour={colours.text} />
              </APlayerCircle>
            </Button>
          </View>
        </View>

        <View style={styles.foot} pointerEvents="none">
          <Text style={styles.onNow} numberOfLines={1}>
            {onNow === null ? say('screens.liveTvPage.liveNowNoGuide') : onNow.title}
          </Text>

          {onNow === null || through === null ? null : (
            <View style={styles.line}>
              <Text style={styles.clock}>{liveClockTime(onNow.startsAt)}</Text>
              <View style={styles.bar}>
                <View style={[styles.barFilled, { width: `${(through * 100).toFixed(1)}%` }]} />
              </View>
              <Text style={styles.clock}>{liveClockTime(onNow.endsAt)}</Text>
            </View>
          )}

          {upNext === null ? null : (
            <Text style={styles.next} numberOfLines={1}>
              {say('screens.liveTvPage.nextTimeTitle', {
                time: liveClockTime(upNext.startsAt),
                title: upNext.title,
              })}
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

TheLivePicture.displayName = 'TheLivePicture';

/**
 * Lays the live picture over everything, in a window of its own that turns with the phone and
 * measures its own safe area, since the one outside it was measured upright.
 *
 * @param props - What the picture is told.
 */
const ALivePlayer = (props: ALivePlayerProps) => (
  <Modal
    visible
    animationType="fade"
    supportedOrientations={['portrait', 'landscape']}
    statusBarTranslucent
    onRequestClose={props.onClose}
  >
    <SafeAreaProvider>
      <TheLivePicture {...props} />
    </SafeAreaProvider>
  </Modal>
);

ALivePlayer.displayName = 'ALivePlayer';

export { ALivePlayer };
