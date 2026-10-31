import { useEffect, useState } from 'react';
import { Animated, LayoutAnimation, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { Tv } from '@keyline-icons/react-native';
import { Pause as PauseFilled, Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useWhatIsHeard } from '@ValenceClient/books/useWhatIsHeard';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { dismissDevice } from '@ValenceClient/video/controlledDevice';
import { useVideoRemote } from '@ValenceClient/video/useVideoRemote';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { AMiniProgress } from '@ValenceMobile/components/AMiniProgress/AMiniProgress';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { tintOf } from '@ValenceMobile/theme/tintOf';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { ControlledDevice } from '@ValenceClient/video/controlledDevice';
import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';
import type { AVideoRemoteBarProps } from './AVideoRemoteBar.types';
import { say } from '@ValenceI18n/say';

const ARRIVES = {
  duration: 320,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.82 },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

const PUT_AWAY_PAST = 36;

const PUT_AWAY_FASTER_THAN = 0.6;

const SLIDES_OFF_BY = 120;

const ART_HIGH = 42;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    borderRadius: 8,
    height: ART_HIGH,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ART_HIGH / 1.5,
  },
  bar: { alignItems: 'center', flexDirection: 'row', gap: 12, height: 60, paddingHorizontal: 10 },
  button: { padding: 8 },
  device: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  fills: { height: '100%', width: '100%' },
  over: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  opens: { flex: 1 },
  pill: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 7 },
  pillSaid: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  said: { flex: 1, gap: 1 },
  what: { alignItems: 'center', flexDirection: 'row', gap: 12 },
});

type Shape = 'bar' | 'pill';

type Kept = { device: ControlledDevice; watching: VideoNowWatching | null };

/**
 * A strip above the tabs while this phone is a television's remote, drawn as the music bar is: the
 * poster, tinting the glass, what is playing and on which television, how far it has got, and play
 * and pause to hand, opening the whole remote when pressed. Nothing is drawn while this phone
 * controls nothing.
 *
 * What the phone itself is playing comes first, so while music or a book has the bar beneath, this
 * shrinks to a pill naming the television, which still opens the remote. It eases in and out, and
 * changes between the two, rather than jumping. Swiping it down puts the remote away without
 * stopping the film, and the television is then left alone until it has properly stopped; a screen
 * reader offers the same as an action.
 *
 * @param onOpen - Told to open the whole remote.
 */
const AVideoRemoteBar = ({ onOpen }: AVideoRemoteBarProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const { device, watching, positionSeconds, send } = useVideoRemote();
  const heard = useWhatIsHeard(thePhonesAudiobookPlayer(), thePhonesMusicPlayer());
  const shape: Shape | null = device === null ? null : heard === null ? 'bar' : 'pill';
  const [drawn, setDrawn] = useState<Shape | null>(shape);
  const [kept, setKept] = useState<Kept | null>(device === null ? null : { device, watching });
  const [slid] = useState(() => new Animated.Value(0));
  const [latest] = useState(() => new Map<'now', { clientId: string | null; isStill: boolean }>());

  useEffect(() => {
    latest.set('now', { clientId: device?.clientId ?? null, isStill });
  });

  useEffect(() => {
    if (device !== null) {
      setKept({ device, watching });
    }
  }, [device, watching]);

  useEffect(() => {
    if (shape === drawn) {
      return;
    }

    if (!isStill) {
      LayoutAnimation.configureNext(ARRIVES);
    }

    if (shape !== null && drawn === null) {
      slid.setValue(0);
    }

    setDrawn(shape);
  }, [shape, drawn, isStill, slid]);

  const [swipe] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dy > 10 && gesture.dy > Math.abs(gesture.dx) * 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        slid.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderTerminate: () => {
        Animated.spring(slid, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();
      },
      onPanResponderRelease: (_, gesture) => {
        const now = latest.get('now');
        const clientId = now?.clientId ?? null;

        if (
          clientId === null ||
          (gesture.dy < PUT_AWAY_PAST && gesture.vy < PUT_AWAY_FASTER_THAN)
        ) {
          Animated.spring(slid, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();

          return;
        }

        if (now?.isStill === true) {
          dismissDevice(clientId);

          return;
        }

        Animated.timing(slid, {
          toValue: SLIDES_OFF_BY,
          duration: 160,
          useNativeDriver: true,
        }).start(() => {
          dismissDevice(clientId);
        });
      },
    }),
  );

  const showing = drawn === null ? null : device === null ? kept : { device, watching };
  const poster =
    showing === null || showing.watching === null
      ? null
      : onThisServer(
          artworkUrl(showing.watching.mediaId, 'poster', { isOfTitle: true, size: 'small' }),
        );
  const tint = tintOf(usePictureLights(poster));

  if (showing === null) {
    return null;
  }

  const isPlaying = showing.watching?.isPlaying ?? false;
  const dismissal = {
    label: say('screens.videoRemoteBar.hideTheRemote'),
    onDismiss: () => {
      dismissDevice(showing.device.clientId);
    },
  };
  const opacity = slid.interpolate({
    inputRange: [0, SLIDES_OFF_BY],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (drawn === 'pill') {
    return (
      <Animated.View
        {...swipe.panHandlers}
        style={[styles.pill, { opacity, transform: [{ translateY: slid }] }]}
      >
        <AGlass roundness={999} />
        <Button
          tone="bare"
          label={say('screens.videoRemoteBar.openTheRemoteForLabel', {
            label: showing.device.label,
          })}
          dismissal={dismissal}
          onPress={onOpen}
        >
          <View style={styles.pillSaid}>
            <Icon of={Tv} size={16} colour={colours.text} />
            <Words size="small" lines={1}>
              {showing.device.label}
            </Words>
          </View>
        </Button>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      {...swipe.panHandlers}
      style={[styles.bar, { opacity, transform: [{ translateY: slid }] }]}
    >
      <AGlass
        roundness={16}
        {...(tint === null
          ? {}
          : { tint: Platform.OS === 'ios' ? withAlpha(tint, 0.55) : withAlpha(tint, 0.96) })}
      />

      <View style={styles.opens}>
        <Button
          tone="bare"
          label={say('screens.videoRemoteBar.openTheRemoteForLabel', {
            label: showing.device.label,
          })}
          dismissal={dismissal}
          onPress={onOpen}
        >
          <View style={styles.what}>
            <View style={[styles.art, { backgroundColor: colours.surfaceRaised }]}>
              <Icon of={Tv} size={18} colour={colours.textMuted} />
              {poster === null ? null : (
                <View style={styles.over}>
                  <ARemotePicture style={styles.fills} uri={poster} />
                </View>
              )}
            </View>
            <View style={styles.said}>
              <Words lines={1}>{showing.watching?.title ?? say('common.starting')}</Words>
              <View style={styles.device}>
                <Icon of={Tv} size={14} colour={colours.accent} />
                <Words size="small" tone="accent" lines={1}>
                  {showing.device.label}
                </Words>
              </View>
              <AMiniProgress
                positionSeconds={positionSeconds}
                durationSeconds={showing.watching?.durationSeconds ?? 0}
              />
            </View>
          </View>
        </Button>
      </View>
      <Button
        tone="bare"
        label={isPlaying ? say('common.pause') : say('common.play')}
        isDisabled={showing.watching === null}
        onPress={() => {
          send({ kind: isPlaying ? 'pause' : 'resume' });
        }}
      >
        <View style={styles.button}>
          <Icon of={isPlaying ? PauseFilled : PlayFilled} size={24} colour={colours.text} />
        </View>
      </Button>
    </Animated.View>
  );
};

AVideoRemoteBar.displayName = 'AVideoRemoteBar';

export { AVideoRemoteBar };
