import { Check } from '@keyline-icons/react-native/fill';
import { StyleSheet, View } from 'react-native';
import { ASheet } from '@ValencePhone/components/ASheet/ASheet';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { asAClock } from '@ValencePhone/components/Watching/asAClock';
import { useChapterPlaying } from '@ValenceClient/books/useChapterPlaying';
import { useTheBook } from '@ValencePhone/hooks/useTheBook';
import { thePhonesAudiobookPlayer } from '@ValencePhone/books/thePhonesAudiobookPlayer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheChaptersProps } from './TheChapters.types';

const TICK = 20;

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  tick: { width: TICK },
  title: { flex: 1 },
});

/**
 * Every chapter of the book playing, in a sheet, each with how long it lasts and a tick beside the
 * one playing; choosing one goes straight to its start and puts the sheet away.
 *
 * @param isOpen - Whether it is out.
 * @param onClose - Told to put it away.
 */
const TheChapters = ({ isOpen, onClose }: TheChaptersProps) => {
  const colours = useTheColours();
  const { player, state } = useTheBook();
  const at = useChapterPlaying(thePhonesAudiobookPlayer());

  return (
    <ASheet isOpen={isOpen} title="Chapters" onClose={onClose}>
      {state.chapters.map((chapter, index) => (
        <Button
          key={`${index.toString()}:${chapter.title}`}
          tone="bare"
          label={chapter.title}
          isChosen={index === at}
          onPress={() => {
            player.goToChapter(index);
            onClose();
          }}
        >
          <View style={styles.row}>
            <View style={styles.tick}>
              {index === at ? <Icon of={Check} size={TICK} colour={colours.text} /> : null}
            </View>
            <View style={styles.title}>
              <Words lines={1}>{chapter.title}</Words>
            </View>
            <Words size="small" tone="muted">
              {asAClock(chapter.bookEndSeconds - chapter.bookStartSeconds)}
            </Words>
          </View>
        </Button>
      ))}
    </ASheet>
  );
};

TheChapters.displayName = 'TheChapters';

export { TheChapters };
