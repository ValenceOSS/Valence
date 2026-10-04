import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useTVEventHandler,
  View,
} from 'react-native';
import type { HWEvent } from 'react-native';
import { SkipForward, X } from '@keyline-icons/react-native';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { nameTheNextEpisode } from '@ValenceClient/playback/nameTheNextEpisode';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { UpNextProps } from './UpNext.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const STILL = { width: 560, height: 315 };

const BAR_TALL = 6;

const ARRIVES_MS = 450;

const SLIDES_FROM = 80;

const STARTS_AT = 0.1;

const RECLAIMS_AFTER_MS = 120;

/**
 * The card in the corner as an episode ends, offering the next one: its still, its place and name,
 * and a bar along the still that fills until this episode ends and the next starts on its own — or,
 * when enough have followed on without anybody touching the remote, asking whether anybody is still
 * there rather than counting. For somebody who asked for less motion, the seconds left are written
 * out instead of the bar.
 *
 * @param episode - What comes next.
 * @param isAsking - Whether to ask rather than count down.
 * @param offer - How far the count to the end has got, or null once the episode has ended.
 * @param onPlay - Told to start it now.
 * @param onStay - Told to put the card away and stay with the credits.
 *
 * The player beneath it can take the remote on tvOS, since the system's player view is focusable
 * and covers the screen, so the card moves the remote itself rather than trusting the television to
 * find the button beside: left and right go to Play Next and Watch Credits, the television's own
 * moves out of the card are refused, and whenever the remote is pulled off both, it is handed back
 * to the one it was last on.
 */
const UpNext = ({ episode, isAsking, offer, onPlay, onStay }: UpNextProps) => {
  const isStill = usePrefersStillness();
  const isCounting = !isAsking && offer !== null;
  const [arriving] = useState(() => new Animated.Value(STARTS_AT));
  const playRef = useRef<View>(null);
  const creditsRef = useRef<View>(null);
  const holder = useRef<'play' | 'credits' | null>(null);
  const wanted = useRef<'play' | 'credits'>('play');
  const reclaiming = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTheRemote = useCallback(() => {
    (wanted.current === 'play' ? playRef : creditsRef).current?.requestTVFocus();
  }, []);

  const reclaim = useCallback(() => {
    if (reclaiming.current !== null) {
      clearTimeout(reclaiming.current);
    }

    reclaiming.current = setTimeout(() => {
      reclaiming.current = null;

      if (holder.current !== wanted.current) {
        sendTheRemote();
      }
    }, RECLAIMS_AFTER_MS);
  }, [sendTheRemote]);

  const holdTheRemote = useCallback((button: 'play' | 'credits') => {
    holder.current = button;
    wanted.current = button;
  }, []);

  const hearRemote = useCallback(
    (event: HWEvent) => {
      const heading =
        event.eventType === 'right' || event.eventType === 'swipeRight'
          ? 'credits'
          : event.eventType === 'left' || event.eventType === 'swipeLeft'
            ? 'play'
            : null;

      if (heading === null) {
        return;
      }

      wanted.current = heading;
      sendTheRemote();
      reclaim();
    },
    [sendTheRemote, reclaim],
  );

  useTVEventHandler(hearRemote);

  const loseTheRemote = useCallback(
    (button: 'play' | 'credits') => {
      if (holder.current === button) {
        holder.current = null;
      }

      reclaim();
    },
    [reclaim],
  );

  useEffect(() => {
    reclaim();

    return () => {
      if (reclaiming.current !== null) {
        clearTimeout(reclaiming.current);
      }
    };
  }, [reclaim]);

  useEffect(() => {
    Animated.timing(arriving, {
      toValue: 1,
      duration: ARRIVES_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => {
      arriving.stopAnimation();
    };
  }, [arriving]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: arriving,
          transform: isStill
            ? []
            : [
                {
                  translateX: arriving.interpolate({
                    inputRange: [STARTS_AT, 1],
                    outputRange: [SLIDES_FROM, 0],
                  }),
                },
              ],
        },
      ]}
    >
      <TVFocusGuideView trapFocusLeft trapFocusRight trapFocusUp trapFocusDown>
        <View style={[STILL, styles.still]}>
          <Artwork
            path={episode.hasBackdrop ? artworkUrl(episode.id, 'backdrop') : null}
            style={STILL}
          />

          {isCounting && !isStill ? (
            <View style={styles.bar}>
              <View
                style={[
                  styles.counted,
                  { transform: [{ scaleX: Math.min(Math.max(offer.counted, 0), 1) }] },
                ]}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.heading}>
          <Text style={styles.label}>
            {isAsking ? say('common.areYouStillWatching') : say('common.nextEpisode')}
          </Text>
          {isCounting && isStill ? (
            <Text style={styles.label}>
              {sayCount('common.startsInCountSeconds', Math.ceil(offer.secondsLeft))}
            </Text>
          ) : null}
        </View>
        <Text numberOfLines={2} style={styles.name}>
          {nameTheNextEpisode(episode)}
        </Text>

        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              label={
                isAsking ? say('tv.player.upNext.keepWatching') : say('common.playNextEpisode')
              }
              icon={SkipForward}
              variant="confirm"
              size="md"
              isWide
              hasPreferredFocus
              ref={playRef}
              onFocus={() => {
                holdTheRemote('play');
              }}
              onBlur={() => {
                loseTheRemote('play');
              }}
              onPress={onPlay}
            />
          </View>
          <View style={styles.action}>
            <Button
              label={isAsking ? say('common.cancel') : say('common.watchCredits')}
              {...(isAsking ? { icon: X } : {})}
              variant="overlay"
              size="md"
              isWide
              ref={creditsRef}
              onFocus={() => {
                holdTheRemote('credits');
              }}
              onBlur={() => {
                loseTheRemote('credits');
              }}
              onPress={onStay}
            />
          </View>
        </View>
      </TVFocusGuideView>
    </Animated.View>
  );
};

UpNext.displayName = 'UpNext';

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    right: tokens.space.edge,
    bottom: tokens.space.xl * 2 + tokens.space.lg,
    width: STILL.width,
  },
  still: { borderRadius: tokens.radii.lg, marginBottom: tokens.space.sm, overflow: 'hidden' },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_TALL,
    backgroundColor: tokens.colours.scrim,
  },
  counted: {
    height: '100%',
    backgroundColor: tokens.colours.onScrim,
    transformOrigin: 'left center',
  },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: tokens.space.sm },
  label: { color: tokens.colours.muted, fontSize: tokens.type.small },
  name: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  action: { flex: 1 },
  actions: { flexDirection: 'row', gap: tokens.space.sm, marginTop: tokens.space.sm },
});

export { UpNext };
