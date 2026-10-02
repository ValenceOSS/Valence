import { StyleSheet, View } from 'react-native';
import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ACalendarEntryProps } from './ACalendarEntry.types';

const styles = StyleSheet.create({
  poster: { borderRadius: 6, height: 66, width: 44 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 10 },
  words: { flex: 1, gap: 3 },
});

/**
 * One thing released on the release calendar, as a row of its day: its poster, its title, which
 * episode or which release it is, and where it has got to, opening it when pressed.
 *
 * @param entry - What is released.
 * @param onOpen - Told it was pressed.
 */
const ACalendarEntry = ({ entry, onOpen }: ACalendarEntryProps) => {
  const colours = useTheColours();
  const poster =
    entry.artworkMediaId === null
      ? entry.posterUrl === null
        ? null
        : pictureOnThisServer(entry.posterUrl)
      : onThisServer(`/api/media/${entry.artworkMediaId}/image/poster`);
  const state = describeCalendarState(entry.state);

  return (
    <Button
      tone="bare"
      label={`${entry.title}, ${describeCalendarEntry(entry)}`}
      onPress={() => {
        onOpen(entry);
      }}
    >
      <View style={styles.row}>
        {poster === null ? (
          <View style={[styles.poster, { backgroundColor: colours.surfaceRaised }]} />
        ) : (
          <ARemotePicture
            style={[styles.poster, { backgroundColor: colours.surfaceRaised }]}
            uri={poster}
          />
        )}

        <View style={styles.words}>
          <Words lines={1}>{entry.title}</Words>
          <Words size="small" tone="muted" lines={1}>
            {describeCalendarEntry(entry)}
          </Words>
          <Words size="small" tone={state.tone === 'success' ? 'accent' : 'muted'} lines={1}>
            {entry.requestedBy === null
              ? state.label
              : `${state.label} · ${entry.requestedBy.name}`}
          </Words>
        </View>
      </View>
    </Button>
  );
};

ACalendarEntry.displayName = 'ACalendarEntry';

export { ACalendarEntry };
