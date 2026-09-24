import { StyleSheet, View } from 'react-native';
import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { describeLength } from '@ValenceClient/books/describeLength';
import { Slider } from '@ValencePhone/components/Slider/Slider';
import { Words } from '@ValencePhone/components/Words/Words';
import { asAClock } from '@ValencePhone/components/Watching/asAClock';
import { useTheBook } from '@ValencePhone/hooks/useTheBook';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { ThePlaceInTheChapterProps } from './ThePlaceInTheChapter.types';

const styles = StyleSheet.create({
  lasts: { alignItems: 'flex-end' },
  left: { flex: 2, alignItems: 'center' },
  time: { flex: 1 },
  times: { alignItems: 'center', flexDirection: 'row' },
});

/**
 * Where the chapter has got to, as a bar to scrub through, the time gone and the time left of the
 * chapter beneath it, and between them how long is left of the whole book at the speed it plays —
 * drawn again as the book moves without drawing the rest of the player again.
 *
 * @param title - The chapter's name, for the bar's label.
 */
const ThePlaceInTheChapter = ({ title }: ThePlaceInTheChapterProps) => {
  const colours = useTheColours();
  const { player, state } = useTheBook({ followsPosition: true });
  const chapter = state.chapters[chapterPlaying(state)];
  const starts = chapter?.bookStartSeconds ?? 0;
  const lasts = (chapter?.bookEndSeconds ?? state.durationSeconds) - starts;
  const position = Math.min(Math.max(state.bookPositionSeconds - starts, 0), lasts);
  const left = (state.durationSeconds - state.bookPositionSeconds) / state.speed;

  return (
    <View>
      <Slider
        label={`Move through ${title}`}
        value={position}
        furthest={lasts}
        colour={colours.text}
        restColour={withAlpha(colours.text, 0.2)}
        aheadColour={withAlpha(colours.text, 0.35)}
        onScrubbed={(to) => {
          player.seek(starts + to);
        }}
      />
      <View style={styles.times}>
        <View style={styles.time}>
          <Words size="small" tone="muted">
            {asAClock(position)}
          </Words>
        </View>
        <View style={styles.left}>
          <Words size="small" tone="muted">
            {`${describeLength(left)} left`}
          </Words>
        </View>
        <View style={[styles.time, styles.lasts]}>
          <Words size="small" tone="muted">
            {`−${asAClock(Math.max(lasts - position, 0))}`}
          </Words>
        </View>
      </View>
    </View>
  );
};

ThePlaceInTheChapter.displayName = 'ThePlaceInTheChapter';

export { ThePlaceInTheChapter };
