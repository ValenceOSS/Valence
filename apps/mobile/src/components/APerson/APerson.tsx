import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { formatCalendarDate } from '@ValenceCore/functions/formatCalendarDate';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { APersonProps } from './APerson.types';
import { say } from '@ValenceI18n/say';

const PORTRAIT = 140;

const A_FEW_LINES = 6;

const styles = StyleSheet.create({
  portrait: { borderRadius: PORTRAIT / 2, height: PORTRAIT, overflow: 'hidden', width: PORTRAIT },
  photo: { height: '100%', width: '100%' },
  top: { alignItems: 'center', gap: 10 },
});

/**
 * Somebody who appears in the library: who they are, and everything here they are in.
 *
 * @param personId - Who.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 * @param onBack - Told somebody is done with them.
 */
const APerson = ({ personId, onLookAt, onLookAtShow, onBack }: APersonProps) => {
  const colours = useTheColours();
  const person = useQuery(libraryQueries.person(personId));
  const credits = useQuery(libraryQueries.credits(personId));
  const [isAllOfIt, setIsAllOfIt] = useState(false);
  const who = person.data ?? null;

  if (person.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  const shelves = [
    {
      named: 'phone.aPerson.films',
      items: credits.data?.films ?? [],
      asProgramme: false,
      isStill: false,
    },
    {
      named: 'phone.aPerson.programmes',
      items: credits.data?.shows ?? [],
      asProgramme: true,
      isStill: false,
    },
    {
      named: 'phone.aPerson.episodes',
      items: credits.data?.episodes ?? [],
      asProgramme: false,
      isStill: true,
    },
  ] as const;

  return (
    <Screen scrolls onBack={onBack}>
      <View style={styles.top}>
        <View style={[styles.portrait, { backgroundColor: colours.surfaceRaised }]}>
          {who?.portraitUrl === null || who === null ? null : (
            <Image
              style={styles.photo}
              source={{ uri: who.portraitUrl }}
              accessibilityIgnoresInvertColors
            />
          )}
        </View>

        <Words size="title">{who?.name ?? say('phone.aPerson.somebody')}</Words>

        {who === null || (who.bornOn === null && who.bornIn === null) ? null : (
          <Words tone="muted">
            {[
              who.bornOn === null
                ? null
                : say('phone.aPerson.born', { when: formatCalendarDate(who.bornOn) }),
              who.bornIn,
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </Words>
        )}
      </View>

      {who?.biography === null || who === null ? null : (
        <>
          <Words tone="muted" {...(isAllOfIt ? {} : { lines: A_FEW_LINES })}>
            {who.biography}
          </Words>

          {isAllOfIt ? null : (
            <Button
              tone="quiet"
              onPress={() => {
                setIsAllOfIt(true);
              }}
            >
              {say('phone.aPerson.more')}
            </Button>
          )}
        </>
      )}

      {shelves
        .filter((shelf) => shelf.items.length > 0)
        .map((shelf) => (
          <AShelf key={shelf.named} title={say(shelf.named)}>
            {shelf.items.map((media) => (
              <ACard
                key={media.id}
                media={media}
                asProgramme={shelf.asProgramme}
                isStill={shelf.isStill}
                onLookAt={onLookAt}
                onLookAtShow={onLookAtShow}
              />
            ))}
          </AShelf>
        ))}
    </Screen>
  );
};

APerson.displayName = 'APerson';

export { APerson };
