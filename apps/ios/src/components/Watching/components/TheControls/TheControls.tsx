import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
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

const styles = StyleSheet.create({
  clock: { color: OVER_THE_PICTURE, fontSize: 13, fontVariant: ['tabular-nums'] },
  foot: { gap: 2, paddingHorizontal: EDGE },
  head: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  middle: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: 44,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
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
 * The middle row is centred on the screen rather than between the other two, because those two are
 * different heights and centring between them puts the play button above the middle of the film.
 *
 * Only the top row is held off the cutout. Sideways, the cutout is a band down the middle of one
 * long edge and nothing else: holding everything off it would indent the scrubber by an inch for
 * the sake of something it never reaches, which is how a phone with a screen this size ends up
 * drawing a picture the size of an older one's.
 *
 * @param title - What is playing.
 * @param year - When it came out, where that is known.
 * @param isPlaying - Whether the picture is moving.
 * @param at - How far in they are.
 * @param runsFor - How long it runs.
 * @param buffered - How much of it has arrived.
 * @param onPlayPause - Told to stop or start it.
 * @param onSkip - Told to jump, in seconds, forwards or back.
 * @param onSeek - Told where they scrubbed to.
 * @param onTouched - Told they are still there, so this does not fade out from under them.
 * @param onClose - Told they are done watching.
 * @param onSettings - Told they want the rest of it.
 */
const TheControls = ({
  title,
  year,
  isPlaying,
  at,
  runsFor,
  buffered,
  onPlayPause,
  onSkip,
  onSeek,
  onTouched,
  onClose,
  onSettings,
}: TheControlsProps) => {
  const room = useSafeAreaInsets();

  return (
    <View style={[styles.whole, { paddingBottom: room.bottom + 12, paddingTop: room.top + 12 }]}>
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
          <Icon of="X" size={26} colour={OVER_THE_PICTURE} />
        </Button>

        <View style={styles.said}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {year === null ? null : <Text style={styles.year}>{year}</Text>}
        </View>

        <Button tone="bare" label="Subtitles, audio and quality" onPress={onSettings}>
          <Icon of="Settings" size={26} colour={OVER_THE_PICTURE} />
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
          <View style={styles.step}>
            <Icon of="RotateCcw" size={40} colour={OVER_THE_PICTURE} />
            <Text style={styles.stepHowFar}>{A_STEP}</Text>
          </View>
        </Button>

        <Button tone="bare" label={isPlaying ? 'Pause' : 'Play'} onPress={onPlayPause}>
          <Icon of={isPlaying ? 'Pause' : 'Play'} size={52} colour={OVER_THE_PICTURE} />
        </Button>

        <Button
          tone="bare"
          label={`Forward ${A_STEP.toString()} seconds`}
          onPress={() => {
            onSkip(A_STEP);
          }}
        >
          <View style={styles.step}>
            <Icon of="RotateCw" size={40} colour={OVER_THE_PICTURE} />
            <Text style={styles.stepHowFar}>{A_STEP}</Text>
          </View>
        </Button>
      </View>

      <View style={styles.foot} pointerEvents="box-none">
        <Slider
          label={`Seek through ${title}`}
          value={at}
          furthest={runsFor}
          buffered={buffered}
          colour={OVER_THE_PICTURE}
          restColour={THE_REST}
          aheadColour={ARRIVED}
          onScrubbing={onTouched}
          onScrubbed={onSeek}
        />

        <View style={styles.times}>
          <Text style={styles.clock}>{asAClock(at)}</Text>
          <Text style={styles.clock}>{`−${asAClock(Math.max(runsFor - at, 0))}`}</Text>
        </View>
      </View>
    </View>
  );
};

TheControls.displayName = 'TheControls';

export { TheControls };
