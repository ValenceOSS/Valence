import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { ListVideo, Pause, Play, RotateCcw, RotateCw, Settings, X } from 'lucide-react-native';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { TheFrameAt } from '@ValencePhone/components/Watching/components/TheFrameAt/TheFrameAt';
import { Slider } from '@ValencePhone/components/Slider/Slider';
import { asAClock } from '@ValencePhone/components/Watching/asAClock';
import type { TheControlsProps } from './TheControls.types';

const OVER_THE_PICTURE = '#ffffff';

const SCRIM = 'rgba(0, 0, 0, 0.45)';

const THE_REST = 'rgba(255, 255, 255, 0.3)';

const ARRIVED = 'rgba(255, 255, 255, 0.5)';

const QUIETLY = 'rgba(255, 255, 255, 0.65)';

const A_STEP = 10;

const EDGE = 24;

const FRAME_WIDE = 168;

const styles = StyleSheet.create({
  clock: { color: OVER_THE_PICTURE, fontSize: 13, fontVariant: ['tabular-nums'] },
  foot: { gap: 2, paddingHorizontal: EDGE },
  frameAt: { alignItems: 'center', bottom: '100%', gap: 4, marginBottom: 8, position: 'absolute' },
  frameClock: { color: '#ffffff', fontSize: 13, fontVariant: ['tabular-nums'], fontWeight: '600' },
  head: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  middle: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: 56,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  reach: { padding: 14 },
  step: { alignItems: 'center', justifyContent: 'center' },
  stepHowFar: {
    color: OVER_THE_PICTURE,
    fontSize: 9,
    fontWeight: '700',
    position: 'absolute',
  },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  said: { alignItems: 'baseline', flex: 1, flexDirection: 'row', gap: 7 },
  title: { color: OVER_THE_PICTURE, fontSize: 15, fontWeight: '600' },
  year: { color: QUIETLY, fontSize: 13 },
  whole: {
    backgroundColor: SCRIM,
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

/**
 * Everything a viewer can reach while a film is playing, and nothing else.
 *
 * Three rows and one way out to more: the way out is the whole idea. A player that puts its
 * settings on the picture becomes a settings panel with a film behind it, and there is no shortage
 * of those. What is here is what somebody reaches for without thinking — stop it, go back a bit,
 * find a moment — and everything they would have to think about first lives behind one button.
 *
 * It is drawn white on a scrim rather than in the theme, because what it sits on is a film and not
 * a page, and a light theme over a dark scene is unreadable either way round.
 *
 * Nothing but the controls themselves takes a touch, so a tap on the picture reaches what is
 * behind this and puts it away — which is what a tap on a playing film means everywhere else.
 *
 * It fades rather than appearing. Controls that snap on over a moving picture read as a fault in
 * the picture, and ones that snap off take a moment of the film with them.
 *
 * The middle row is centred on the screen rather than between the other two, because those two are
 * different heights and centring between them puts the play button above the middle of the film.
 *
 * Each of the three reaches further than it is drawn. A thumb on a phone held sideways is nowhere
 * near as precise as a cursor, and a control that has to be aimed at is one somebody misses.
 *
 * Only the top row is held off the cutout. Sideways, the cutout is a band down the middle of one
 * long edge and nothing else: holding everything off it would indent the scrubber by an inch for
 * the sake of something it never reaches, which is how a phone with a screen this size ends up
 * drawing a picture the size of an older one's.
 *
 * @param fade - How far in or out it is, which whoever decides it is showing keeps hold of.
 * @param title - What is playing.
 * @param year - When it came out, where that is known.
 * @param isPlaying - Whether the picture is moving.
 * @param at - How far in they are.
 * @param runsFor - How long it runs.
 * @param buffered - How much of it has arrived.
 * @param trickplay - The film's thumbnails, to show the moment being scrubbed to, where it has any.
 * @param onPlayPause - Told to stop or start it.
 * @param onSkip - Told to jump, in seconds, forwards or back.
 * @param onSeek - Told where they scrubbed to.
 * @param onTouched - Told they are still there, so this does not fade out from under them.
 * @param onClose - Told they are done watching.
 * @param onSettings - Told they want the rest of it.
 * @param onEpisodes - Told they want another episode, where this is one.
 */
const TheControls = ({
  fade,
  title,
  year,
  isPlaying,
  at,
  runsFor,
  buffered,
  trickplay,
  onPlayPause,
  onSkip,
  onSeek,
  onTouched,
  onClose,
  onSettings,
  onEpisodes,
}: TheControlsProps) => {
  const room = useSafeAreaInsets();
  const [scrubbingTo, setScrubbingTo] = useState<number | null>(null);
  const [lineWide, setLineWide] = useState(0);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.whole,
        { opacity: fade, paddingBottom: room.bottom + 12, paddingTop: room.top + 12 },
      ]}
    >
      <View
        pointerEvents="box-none"
        style={[
          styles.head,
          {
            paddingLeft: Math.max(room.left, EDGE),
            paddingRight: Math.max(room.right, EDGE),
          },
        ]}
      >
        <Button tone="bare" label="Stop watching" onPress={onClose}>
          <Icon of={X} size={26} colour={OVER_THE_PICTURE} />
        </Button>

        <View style={styles.said}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {year === null ? null : <Text style={styles.year}>{year}</Text>}
        </View>

        {onEpisodes === undefined ? null : (
          <Button tone="bare" label="Episodes" onPress={onEpisodes}>
            <Icon of={ListVideo} size={26} colour={OVER_THE_PICTURE} />
          </Button>
        )}

        <Button tone="bare" label="Subtitles, audio and quality" onPress={onSettings}>
          <Icon of={Settings} size={26} colour={OVER_THE_PICTURE} />
        </Button>
      </View>

      <View style={styles.middle} pointerEvents="box-none">
        <Button
          tone="bare"
          label={`Back ${A_STEP.toString()} seconds`}
          onPress={() => {
            onSkip(-A_STEP);
          }}
        >
          <View style={[styles.step, styles.reach]}>
            <Icon of={RotateCcw} size={40} colour={OVER_THE_PICTURE} />
            <Text style={styles.stepHowFar}>{A_STEP}</Text>
          </View>
        </Button>

        <Button tone="bare" label={isPlaying ? 'Pause' : 'Play'} onPress={onPlayPause}>
          <View style={styles.reach}>
            <Icon of={isPlaying ? Pause : Play} size={62} colour={OVER_THE_PICTURE} />
          </View>
        </Button>

        <Button
          tone="bare"
          label={`Forward ${A_STEP.toString()} seconds`}
          onPress={() => {
            onSkip(A_STEP);
          }}
        >
          <View style={[styles.step, styles.reach]}>
            <Icon of={RotateCw} size={40} colour={OVER_THE_PICTURE} />
            <Text style={styles.stepHowFar}>{A_STEP}</Text>
          </View>
        </Button>
      </View>

      <View
        style={styles.foot}
        pointerEvents="box-none"
        onLayout={(event) => {
          setLineWide(event.nativeEvent.layout.width - EDGE * 2);
        }}
      >
        {trickplay === null || scrubbingTo === null || runsFor <= 0 ? null : (
          <View
            style={[
              styles.frameAt,
              {
                left:
                  EDGE +
                  Math.min(
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

        <Slider
          label={`Seek through ${title}`}
          value={at}
          furthest={runsFor}
          buffered={buffered}
          colour={OVER_THE_PICTURE}
          restColour={THE_REST}
          aheadColour={ARRIVED}
          onScrubbing={(to) => {
            setScrubbingTo(to);
            onTouched();
          }}
          onScrubbed={(to) => {
            setScrubbingTo(null);
            onSeek(to);
          }}
        />

        <View style={styles.times}>
          <Text style={styles.clock}>{asAClock(at)}</Text>
          <Text style={styles.clock}>{`−${asAClock(Math.max(runsFor - at, 0))}`}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

TheControls.displayName = 'TheControls';

export { TheControls };
