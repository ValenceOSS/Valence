import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { describeBirthLine } from '@ValenceClient/people/describeBirthLine';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { ACardPart } from '@ValenceMobile/components/ACardPart/ACardPart';
import { AHairline } from '@ValenceMobile/components/AHairline/AHairline';
import { AnOverview } from '@ValenceMobile/components/AnOverview/AnOverview';
import { APersonHead } from '@ValenceMobile/components/APerson/components/APersonHead/APersonHead';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { ATintedGround } from '@ValenceMobile/components/ATintedGround/ATintedGround';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { usePictureTint } from '@ValenceMobile/hooks/usePictureTint';
import { GROUND } from '@ValenceMobile/theme/GROUND';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { APersonProps } from './APerson.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const styles = StyleSheet.create({
  headline: { alignItems: 'center', gap: 6 },
});

/**
 * Somebody who appears in the library, as a card as a film is: their portrait edge to edge with
 * their name over it, tinted with the portrait's colour on a dark page; when and where they were
 * born and how much of theirs is here; their biography held to a few lines; and everything here
 * they are in, a row each for films, programmes and episodes. Each part rises into place a moment
 * after the one above it.
 *
 * Somebody with no portrait is named at the top of the card instead.
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
  const who = person.data ?? null;
  const portraitUrl = who?.portraitUrl ?? null;
  const tint = usePictureTint(portraitUrl);

  if (person.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ASpinner colour={colours.textMuted} />
      </Screen>
    );
  }

  const name = who?.name ?? say('common.somebody');
  const films = credits.data?.films ?? [];
  const shows = credits.data?.shows ?? [];
  const episodes = credits.data?.episodes ?? [];
  const born = who === null ? null : describeBirthLine(who);
  const counts = [
    films.length === 0 ? null : sayCount('common.count.films', films.length),
    shows.length === 0 ? null : sayCount('common.count.shows', shows.length),
  ].filter((count) => count !== null);
  const biography = who?.biography ?? null;
  const shelves = [
    { title: say('common.films'), items: films, asProgramme: false, isStill: false },
    { title: say('common.programmes'), items: shows, asProgramme: true, isStill: false },
    { title: say('common.episodes'), items: episodes, asProgramme: false, isStill: true },
  ].filter((shelf) => shelf.items.length > 0);

  return (
    <GROUND.Provider value={tint}>
      <Screen
        scrolls
        title={name}
        onBack={onBack}
        {...(portraitUrl === null
          ? {}
          : {
              head: (
                <APersonHead
                  portraitUrl={portraitUrl}
                  name={name}
                  ground={tint ?? colours.surface}
                />
              ),
            })}
        {...(tint === null ? {} : { behind: <ATintedGround tint={tint} /> })}
      >
        <ARising>
          <View style={styles.headline}>
            {portraitUrl === null ? (
              <Words size="title" isCentred>
                {name}
              </Words>
            ) : null}

            {born === null ? null : (
              <Words size="lead" tone="muted" isCentred>
                {born}
              </Words>
            )}

            {counts.length === 0 ? null : (
              <Words tone="muted" isCentred>
                {counts.join(' · ')}
              </Words>
            )}
          </View>
        </ARising>

        {biography === null ? null : (
          <>
            <AHairline />

            <ARising turn={1}>
              <AnOverview>{biography}</AnOverview>
            </ARising>
          </>
        )}

        {shelves.map((shelf, at) => (
          <ARising key={shelf.title} turn={2 + at}>
            <ACardPart>
              <AShelf title={shelf.title}>
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
            </ACardPart>
          </ARising>
        ))}
      </Screen>
    </GROUND.Provider>
  );
};

APerson.displayName = 'APerson';

export { APerson };
