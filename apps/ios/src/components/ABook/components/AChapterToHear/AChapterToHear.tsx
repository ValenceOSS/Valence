import { StyleSheet, View } from 'react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { asAClock } from '@ValencePhone/components/Watching/asAClock';
import type { AChapterToHearProps } from './AChapterToHear.types';

const styles = StyleSheet.create({
  lead: { alignItems: 'center', justifyContent: 'center', minWidth: 24 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  title: { flex: 1 },
});

/**
 * One chapter of an audiobook, as a song is listed on an album: where it comes, its name and how
 * long it lasts, the one playing marked as the playing song is. Pressing it starts the book there.
 *
 * @param title - The chapter's name.
 * @param at - Where it comes among the book's chapters, counting from nought.
 * @param lasts - How long it lasts, in seconds.
 * @param isCurrent - Whether it is the chapter playing.
 * @param onListen - Told where the chapter comes, to start the book there.
 */
const AChapterToHear = ({ title, at, lasts, isCurrent, onListen }: AChapterToHearProps) => (
  <Button
    tone="bare"
    label={`Listen from ${title}`}
    isChosen={isCurrent}
    onPress={() => {
      onListen(at);
    }}
  >
    <View style={styles.row}>
      <View style={styles.lead}>
        <Words size="small" tone={isCurrent ? 'accent' : 'muted'}>
          {(at + 1).toString()}
        </Words>
      </View>
      <View style={styles.title}>
        <Words lines={1} isStrong={isCurrent}>
          {title}
        </Words>
      </View>
      <Words size="small" tone="muted">
        {asAClock(lasts)}
      </Words>
    </View>
  </Button>
);

AChapterToHear.displayName = 'AChapterToHear';

export { AChapterToHear };
