import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { howLongItRuns } from '@ValencePhone/components/ATitle/howLongItRuns';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ATitleProps } from './ATitle.types';

const styles = StyleSheet.create({
  backdrop: { aspectRatio: 16 / 9, borderRadius: 14, width: '100%' },
  facts: { flexDirection: 'row', gap: 12 },
});

/**
 * Everything about one title, and the way into watching it.
 *
 * Somebody part way through is offered where they left first and the beginning second, because the
 * reason they opened this is almost always to carry on — and starting again is a thing you have to
 * ask for rather than a thing that happens to you.
 *
 * @param mediaId - Which title.
 * @param onWatch - Told they want to watch it.
 * @param onBack - Told they are done looking.
 */
const ATitle = ({ mediaId, onWatch, onBack }: ATitleProps) => {
  const asking = useQuery(libraryQueries.detail(mediaId));
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const title = asking.data;
  const carryOnAt = resumeFor(byMediaId(watched.data ?? []), mediaId);

  if (asking.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (title === undefined || title === null) {
    return (
      <Screen centres>
        <Words tone="danger">That title could not be read.</Words>
        <Button tone="quiet" onPress={onBack}>
          Back
        </Button>
      </Screen>
    );
  }

  return (
    <Screen scrolls>
      {title.metadata.hasBackdrop ? (
        <Image
          style={[styles.backdrop, { backgroundColor: colours.surfaceRaised }]}
          source={{ uri: onThisServer(`/api/media/${title.id}/image/backdrop`) }}
          accessibilityIgnoresInvertColors
        />
      ) : null}

      <Words size="title">{title.title}</Words>

      <View style={styles.facts}>
        {title.year === null ? null : <Words tone="muted">{title.year}</Words>}
        <Words tone="muted">{howLongItRuns(title.durationSeconds)}</Words>
      </View>

      {carryOnAt === null ? (
        <Button
          onPress={() => {
            onWatch(title.id, 0);
          }}
        >
          Watch
        </Button>
      ) : (
        <>
          <Button
            onPress={() => {
              onWatch(title.id, carryOnAt);
            }}
          >
            {`Carry on from ${howLongItRuns(carryOnAt)}`}
          </Button>

          <Button
            tone="quiet"
            onPress={() => {
              onWatch(title.id, 0);
            }}
          >
            Start again
          </Button>
        </>
      )}

      {title.metadata.overview === null || title.metadata.overview === undefined ? null : (
        <Words tone="muted">{title.metadata.overview}</Words>
      )}

      <Button tone="quiet" onPress={onBack}>
        Back
      </Button>
    </Screen>
  );
};

ATitle.displayName = 'ATitle';

export { ATitle };
