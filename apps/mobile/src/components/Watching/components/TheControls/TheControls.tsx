import {
  Gauge,
  Info,
  Layers,
  ListVideo,
  Lock,
  MessageSquareLines,
  PictureInPicture,
  RotateCcw,
  RotateCw,
  SkipForward,
  Users,
  X,
} from '@keyline-icons/react-native';
import { Pause, Play } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { TheFrameAt } from '@ValenceMobile/components/Watching/components/TheFrameAt/TheFrameAt';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { asAClock } from '@ValenceMobile/components/Watching/asAClock';
import { AirPlayButton } from '@ValenceMobile/components/AirPlayButton/AirPlayButton';
import { ABrightness } from '@ValenceMobile/components/Watching/components/ABrightness/ABrightness';
import { APlayerAction } from '@ValenceMobile/components/Watching/components/APlayerAction/APlayerAction';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { describePlaybackRate } from '@ValenceClient/playback/describePlaybackRate';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { TheControlsProps } from './TheControls.types';
import { say } from '@ValenceI18n/say';

const A_STEP = 10;

const FRAME_WIDE = 224;

const { colours, edge, icon: ICON, middle: MIDDLE, slot: SLOT } = PLAYER_LOOK;

const styles = StyleSheet.create({
  actions: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center' },
  brightness: { justifyContent: 'center', position: 'absolute' },
  clock: {
    color: colours.text,
    fontFamily: FONTS.sans.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    minWidth: 64,
    textAlign: 'right',
  },
  foot: { gap: 2 },
  frameAt: { alignItems: 'center', bottom: '100%', gap: 4, marginBottom: 8, position: 'absolute' },
  frameClock: {
    color: colours.text,
    fontFamily: FONTS.sans.semibold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  head: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  headEnd: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 0,
    justifyContent: 'flex-end',
  },
  icon: { alignItems: 'center', height: SLOT, justifyContent: 'center', width: SLOT },
  line: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  middle: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  middleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '62%',
  },
  reach: { padding: 16 },
  waiting: { alignItems: 'center', height: MIDDLE, justifyContent: 'center', width: MIDDLE },
  said: {
    alignItems: 'baseline',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
    overflow: 'hidden',
  },
  slider: { flex: 1 },
  step: { alignItems: 'center', justifyContent: 'center' },
  stepHowFar: {
    color: colours.text,
    fontFamily: FONTS.sans.bold,
    fontSize: 13,
    position: 'absolute',
  },
  title: { color: colours.text, flexShrink: 1, fontFamily: FONTS.sans.bold, fontSize: 18 },
  whole: {
    backgroundColor: colours.scrim,
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  year: { color: colours.quiet, fontFamily: FONTS.sans.semibold, fontSize: 14 },
});

/**
 * Everything a viewer reaches for while a film plays, laid out the way the big streaming players
 * have taught everybody to expect.
 *
 * Along the top: what is playing, and the things
 * done to the player itself — the watch party, the stats for nerds, AirPlay, locking the controls,
 * picture in picture and leaving. Down the left side, the screen's brightness. In the middle, ten
 * seconds back, play or pause, and ten seconds on, spread across the picture so a thumb on either
 * side reaches its own. Along the foot, the line through the film with how long is left, and under
 * it, by name, everything that opens a panel of its own: the speed, the episodes, the sound and the
 * subtitles, the quality, and the next episode.
 *
 * It is drawn white on a scrim rather than in the theme, because what it sits on is a film and not
 * a page. Nothing but the controls themselves takes a touch, so a tap on the picture reaches what is
 * behind and puts them away. It fades rather than appearing, and the middle row is centred on the
 * screen rather than between the other two, which are different heights.
 *
 * @param fade - How far in or out it is, which whoever decides it is showing keeps hold of.
 * @param title - What is playing.
 * @param year - When it came out, where that is known.
 * @param isPlaying - Whether the picture is moving.
 * @param wait - Whether it is waiting for more of the film, which turns play and pause into
 *   Valence's own loading mark, and whether that mark is finishing.
 * @param at - How far in they are.
 * @param runsFor - How long it runs.
 * @param buffered - How much of it has arrived.
 * @param trickplay - The film's thumbnails, to show the moment being scrubbed to, where it has any.
 * @param rate - How fast it is playing.
 * @param qualityLabel - What quality is playing, to say beside the button that changes it.
 * @param onPlayPause - Told to stop or start it.
 * @param onSkip - Told to jump, in seconds, forwards or back.
 * @param onSeek - Told where they scrubbed to.
 * @param onTouched - Told they are still there, so this does not fade out from under them.
 * @param onClose - Told they are done watching.
 * @param onLock - Told to lock the controls.
 * @param onPictureInPicture - Told to carry the film on in a picture over everything else.
 * @param onSpeed - Told they want to change the speed.
 * @param onAudioAndSubtitles - Told they want the sound and subtitle choices.
 * @param onQuality - Told they want the quality choices, where there are any.
 * @param onStats - Told they want the stats for nerds.
 * @param onEpisodes - Told they want another episode, where this is one.
 * @param onNext - Told they want the next episode now, where there is one.
 * @param onParty - Told they want the watch party, where one can be had.
 */
const TheControls = ({
  fade,
  title,
  year,
  isPlaying,
  wait,
  at,
  runsFor,
  buffered,
  trickplay,
  rate,
  qualityLabel,
  onPlayPause,
  onSkip,
  onSeek,
  onTouched,
  onClose,
  onLock,
  onPictureInPicture,
  onSpeed,
  onAudioAndSubtitles,
  onQuality,
  onStats,
  onEpisodes,
  onNext,
  onParty,
}: TheControlsProps) => {
  const room = useSafeAreaInsets();
  const [scrubbingTo, setScrubbingTo] = useState<number | null>(null);
  const [lineWide, setLineWide] = useState(0);
  const [headTall, setHeadTall] = useState(0);
  const [footTall, setFootTall] = useState(0);
  const left = Math.max(room.left, edge);
  const right = Math.max(room.right, edge);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.whole,
        { opacity: fade, paddingBottom: room.bottom + 14, paddingTop: Math.max(room.top, 14) },
      ]}
    >
      <View
        pointerEvents="box-none"
        style={[styles.head, { paddingLeft: left, paddingRight: right }]}
        onLayout={(event) => {
          setHeadTall(event.nativeEvent.layout.y + event.nativeEvent.layout.height);
        }}
      >
        <View style={styles.said}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {year === null ? null : <Text style={styles.year}>{year}</Text>}
        </View>

        <View style={styles.headEnd} pointerEvents="box-none">
          <Button tone="bare" label={say('common.statsForNerds')} onPress={onStats}>
            <View style={styles.icon}>
              <Icon of={Info} size={ICON} colour={colours.text} />
            </View>
          </Button>

          {onParty === undefined ? null : (
            <Button tone="bare" label={say('common.partyMenu.watchParty')} onPress={onParty}>
              <View style={styles.icon}>
                <Icon of={Users} size={ICON} colour={colours.text} />
              </View>
            </Button>
          )}

          <View style={styles.icon}>
            <AirPlayButton isOverPicture />
          </View>

          <Button tone="bare" label={say('phone.watching.lockTheControls')} onPress={onLock}>
            <View style={styles.icon}>
              <Icon of={Lock} size={ICON} colour={colours.text} />
            </View>
          </Button>

          <Button
            tone="bare"
            label={say('screens.videoPlayer.playerControls.popOut')}
            onPress={onPictureInPicture}
          >
            <View style={styles.icon}>
              <Icon of={PictureInPicture} size={ICON} colour={colours.text} />
            </View>
          </Button>

          <Button
            tone="bare"
            label={say('phone.watching.theControls.stopWatching')}
            onPress={onClose}
          >
            <View style={styles.icon}>
              <Icon of={X} size={ICON} colour={colours.text} />
            </View>
          </Button>
        </View>
      </View>

      <View style={styles.middle} pointerEvents="box-none">
        <View style={styles.middleRow} pointerEvents="box-none">
          <Button
            tone="bare"
            label={say('phone.watching.theControls.backASTEPSeconds', {
              A_STEP: A_STEP.toString(),
            })}
            onPress={() => {
              onSkip(-A_STEP);
            }}
          >
            <View style={[styles.step, styles.reach]}>
              <Icon of={RotateCcw} size={MIDDLE} colour={colours.text} />
              <Text style={styles.stepHowFar}>{A_STEP}</Text>
            </View>
          </Button>

          <Button
            tone="bare"
            label={isPlaying ? say('common.pause') : say('common.play')}
            onPress={onPlayPause}
          >
            <View style={styles.reach}>
              {wait?.isShown === true ? (
                <View style={styles.waiting}>
                  <ASpinner
                    colour={colours.text}
                    size={MIDDLE}
                    isFinishing={wait.isFinishing}
                    onFilled={wait.onFilled}
                  />
                </View>
              ) : (
                <Icon of={isPlaying ? Pause : Play} size={MIDDLE} colour={colours.text} />
              )}
            </View>
          </Button>

          <Button
            tone="bare"
            label={say('phone.watching.theControls.forwardASTEPSeconds', {
              A_STEP: A_STEP.toString(),
            })}
            onPress={() => {
              onSkip(A_STEP);
            }}
          >
            <View style={[styles.step, styles.reach]}>
              <Icon of={RotateCw} size={MIDDLE} colour={colours.text} />
              <Text style={styles.stepHowFar}>{A_STEP}</Text>
            </View>
          </Button>
        </View>
      </View>

      <View
        style={[styles.brightness, { left: left - 8, top: headTall, bottom: footTall }]}
        pointerEvents="box-none"
      >
        <ABrightness onTouched={onTouched} />
      </View>

      <View
        style={[styles.foot, { paddingLeft: left, paddingRight: right }]}
        pointerEvents="box-none"
        onLayout={(event) => {
          setFootTall(event.nativeEvent.layout.height + room.bottom + 14);
        }}
      >
        <View
          style={styles.line}
          pointerEvents="box-none"
          onLayout={(event) => {
            setLineWide(event.nativeEvent.layout.width - 78);
          }}
        >
          {trickplay === null || scrubbingTo === null || runsFor <= 0 ? null : (
            <View
              style={[
                styles.frameAt,
                {
                  left: Math.min(
                    Math.max((scrubbingTo / runsFor) * lineWide - FRAME_WIDE / 2, 0),
                    Math.max(lineWide - FRAME_WIDE, 0),
                  ),
                },
              ]}
              pointerEvents="none"
            >
              <TheFrameAt trickplay={trickplay} seconds={scrubbingTo} wide={FRAME_WIDE} />
              <Text style={styles.frameClock}>{asAClock(scrubbingTo)}</Text>
            </View>
          )}

          <View style={styles.slider}>
            <Slider
              label={say('common.moveThroughTitle', { title })}
              value={at}
              furthest={runsFor}
              buffered={buffered}
              colour={colours.text}
              restColour={colours.rest}
              aheadColour={colours.ahead}
              onScrubbing={(to) => {
                setScrubbingTo(to);
                onTouched();
              }}
              onScrubbed={(to) => {
                setScrubbingTo(null);
                onSeek(to);
              }}
            />
          </View>

          <Text style={styles.clock}>{asAClock(Math.max(runsFor - (scrubbingTo ?? at), 0))}</Text>
        </View>

        <View style={styles.actions} pointerEvents="box-none">
          <APlayerAction
            icon={Gauge}
            label={say('phone.watching.speedNow', { rate: describePlaybackRate(rate) })}
            onPress={onSpeed}
          />

          {onEpisodes === undefined ? null : (
            <APlayerAction icon={ListVideo} label={say('common.episodes')} onPress={onEpisodes} />
          )}

          {onAudioAndSubtitles === undefined ? null : (
            <APlayerAction
              icon={MessageSquareLines}
              label={say('phone.watching.audioAndSubtitles')}
              onPress={onAudioAndSubtitles}
            />
          )}

          {onQuality === undefined ? null : (
            <APlayerAction
              icon={Layers}
              label={say('phone.watching.qualityNow', { quality: qualityLabel })}
              onPress={onQuality}
            />
          )}

          {onNext === undefined ? null : (
            <APlayerAction icon={SkipForward} label={say('common.nextEpisode')} onPress={onNext} />
          )}
        </View>
      </View>
    </Animated.View>
  );
};

TheControls.displayName = 'TheControls';

export { TheControls };
