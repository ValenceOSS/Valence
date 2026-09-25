import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check, Plus, RotateCcw } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { TitleSpread } from '@ValenceTv/components/TitleSpread/TitleSpread';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { useProgress } from '@ValenceTv/library/useProgress';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { FilmPageProps } from './FilmPage.types';

const STARRING = 4;

/**
 * A film's own page: everything about it beside its picture, and what can be done with it — carry on
 * from where this viewer left off, or start again, and keep it on their list.
 *
 * @param mediaId - The film.
 * @param viewerId - Who is watching, whose list it goes on.
 * @param onPlay - Told to play it, and from where.
 */
const FilmPage = ({ mediaId, viewerId, onPlay }: FilmPageProps) => {
  const { progress } = useProgress();
  const favourites = useFavourites(viewerId);
  const detail = useQuery(libraryQueries.detail(mediaId));
  const film = detail.data ?? null;

  if (film === null) {
    return (
      <View style={styles.waiting}>
        {detail.isPending ? (
          <ActivityIndicator size="large" color={tokens.colours.text} />
        ) : (
          <Text style={styles.problem}>{say('tv.filmPage.notFound')}</Text>
        )}
      </View>
    );
  }

  const resume = resumeFor(progress, film.id);
  const watched = progress.get(film.id);
  const summary = summariseDetail(film);
  const starring = (film.metadata.cast ?? []).slice(0, STARRING).map((member) => member.name);
  const genres = film.metadata.genres ?? [];

  return (
    <TitleSpread
      mediaId={film.id}
      name={film.title}
      hasLogo={film.metadata.hasLogo}
      stillPath={film.metadata.hasBackdrop ? artworkUrl(film.id, 'backdrop') : null}
      facts={joinFacts([
        film.year?.toString(),
        formatDuration(film.durationSeconds),
        typeof film.metadata.rating === 'number' ? `★ ${film.metadata.rating.toFixed(1)}` : null,
      ])}
      badges={qualityBadges(film)}
      tagline={film.metadata.tagline}
      overview={film.metadata.overview}
      credits={[
        ...(starring.length === 0
          ? []
          : [say('tv.titleSpread.starring', { names: starring.join(', ') })]),
        ...(genres.length === 0 ? [] : [genres.join(', ')]),
      ]}
    >
      <ActionRow
        label={
          resume === null
            ? say('tv.filmPage.play')
            : say('tv.filmPage.resumeFrom', { when: formatDuration(resume) })
        }
        icon={Play}
        hasPreferredFocus
        onPress={() => {
          onPlay(summary, resume ?? 0);
        }}
        {...(resume === null || watched === undefined
          ? {}
          : { watchedFraction: watchedFraction(watched) })}
      />

      {resume === null ? null : (
        <ActionRow
          label={say('tv.filmPage.playFromBeginning')}
          icon={RotateCcw}
          onPress={() => {
            onPlay(summary, 0);
          }}
        />
      )}

      <ActionRow
        label={
          favourites.isKept(film.id)
            ? say('tv.filmPage.removeFromMyList')
            : say('tv.filmPage.addToMyList')
        }
        icon={favourites.isKept(film.id) ? Check : Plus}
        onPress={() => {
          favourites.toggle(film.id);
        }}
      />
    </TitleSpread>
  );
};

FilmPage.displayName = 'FilmPage';

const styles = StyleSheet.create({
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { FilmPage };
