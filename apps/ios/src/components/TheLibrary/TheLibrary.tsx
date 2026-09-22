import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { byLastWatched } from '@ValenceClient/playback/byLastWatched';
import { isWorthResuming, watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { theArtworkFor } from '@ValencePhone/components/APoster/theArtworkFor';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { Button } from '@ValencePhone/components/Button/Button';
import { CarryOn } from '@ValencePhone/components/TheLibrary/components/CarryOn/CarryOn';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { TheResults } from '@ValencePhone/components/TheLibrary/components/TheResults/TheResults';
import { useSettled } from '@ValencePhone/hooks/useSettled';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheLibraryProps } from './TheLibrary.types';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const theFractionOf = (progress: WatchProgress | undefined): number =>
  progress === undefined ? 0 : watchedFraction(progress);

const AS_MANY_AS_A_ROW_HOLDS = 20;

const WHAT_A_PHONE_PLAYS: ReadonlySet<string> = new Set(['movies', 'shows']);

const HOLD_STILL_FOR = 250;

const styles = StyleSheet.create({
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
});

/**
 * What is in this household's libraries.
 *
 * It opens on whatever somebody was part way through, drawn from every library rather than the one
 * showing, because they came back for a film and not for a tab.
 *
 * Which library is showing is held here rather than asked of the server, and the first one is
 * chosen as soon as the list arrives: a phone opening on a list of library names asks somebody to
 * make a choice before showing them anything, and the answer is almost always the first one.
 *
 * Searching replaces everything below the box with what was found, across every library rather
 * than the one showing, and puts it all back when the box is cleared.
 *
 * Only libraries a phone can play are offered. Music and books have players of their own that
 * this client does not have yet, and a tab of albums that open in a film player is worse than no
 * tab at all.
 *
 * A library of programmes is drawn a programme to a card rather than an episode to a card. A
 * series of ten seasons is otherwise two hundred posters of the same picture, and the one somebody
 * wanted is somewhere in the middle of them.
 *
 * @param onLookAt - Told which title somebody wants to see more of.
 * @param onLookAtShow - Told which programme, in which library.
 */
const TheLibrary = ({ onLookAt, onLookAtShow }: TheLibraryProps) => {
  const everyLibrary = useQuery(libraryQueries.all());
  const libraries = {
    ...everyLibrary,
    data: everyLibrary.data?.filter((library) => WHAT_A_PHONE_PLAYS.has(library.kind)),
  };
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const [chosen, setChosen] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const searchingFor = useSettled(typed.trim(), HOLD_STILL_FOR);
  const showing = chosen ?? libraries.data?.[0]?.id ?? null;
  const isProgrammes =
    (libraries.data ?? []).find((library) => library.id === showing)?.kind === 'shows';
  const films = useQuery({
    ...libraryQueries.everything(showing === null ? [] : [showing]),
    enabled: showing !== null && !isProgrammes,
  });
  const programmes = useQuery({
    ...libraryQueries.shows(showing),
    enabled: showing !== null && isProgrammes,
  });
  const isWaiting = isProgrammes ? programmes.isPending : films.isPending;
  const isEmpty = isProgrammes
    ? programmes.data !== undefined && programmes.data.length === 0
    : films.data !== undefined && films.data.length === 0;
  const howFar = byMediaId(watched.data ?? []);
  const unfinished = (watched.data ?? []).filter(isWorthResuming).map((one) => one.mediaId);
  const carryingOn = useQuery({
    ...libraryQueries.across(
      (libraries.data ?? []).map((library) => library.id),
      { ids: unfinished, limit: AS_MANY_AS_A_ROW_HOLDS },
    ),
    enabled: unfinished.length > 0 && (libraries.data ?? []).length > 0,
  });

  return (
    <Screen scrolls>
      <Words size="title">Library</Words>

      {libraries.isError ? <Words tone="danger">Those could not be read.</Words> : null}

      <TextField
        label="Search"
        value={typed}
        onValueChange={setTyped}
        placeholder="Search"
        keyboard="search"
      />

      {searchingFor === '' ? (
        <>
          <CarryOn
            items={[...(carryingOn.data ?? [])].sort(byLastWatched(howFar))}
            howFarThrough={(mediaId) => theFractionOf(howFar.get(mediaId))}
            onLookAt={onLookAt}
          />

          <SegmentedRow
            label="Library"
            items={(libraries.data ?? []).map((library) => ({
              id: library.id,
              label: library.name,
            }))}
            value={showing}
            onSelect={setChosen}
          />

          {isWaiting && showing !== null ? <ActivityIndicator color={colours.textMuted} /> : null}

          {isEmpty ? <Words tone="muted">Nothing in here yet.</Words> : null}

          <View style={styles.shelf}>
            {(isProgrammes ? (programmes.data ?? []) : []).map((programme) => (
              <Button
                key={programme.id}
                tone="bare"
                label={programme.title}
                onPress={() => {
                  onLookAtShow(programme.libraryId, programme.id);
                }}
              >
                <APoster
                  title={programme.title}
                  year={programme.year ?? null}
                  artwork={onThisServer(`/api/media/${programme.coverMediaId}/image/poster`)}
                />
              </Button>
            ))}

            {(isProgrammes ? [] : (films.data ?? [])).map((media) => (
              <Button
                key={media.id}
                tone="bare"
                label={media.title}
                onPress={() => {
                  onLookAt(media.id);
                }}
              >
                <APoster
                  title={media.title}
                  year={media.year}
                  artwork={theArtworkFor(media)}
                  watched={theFractionOf(howFar.get(media.id))}
                />
              </Button>
            ))}
          </View>
        </>
      ) : (
        <TheResults
          asked={searchingFor}
          libraryIds={(libraries.data ?? []).map((library) => library.id)}
          howFarThrough={(mediaId) => theFractionOf(howFar.get(mediaId))}
          onLookAt={onLookAt}
          onLookAtShow={onLookAtShow}
        />
      )}
    </Screen>
  );
};

TheLibrary.displayName = 'TheLibrary';

export { TheLibrary };
