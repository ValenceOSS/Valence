import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronsUpDown,
  EyeOff,
  Film,
  Plus,
  RotateCcw,
  Star,
} from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { qualityBadges } from '@ValenceClient/library/qualityBadges';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useHidden } from '@ValenceClient/library/useHidden';
import { useRate } from '@ValenceClient/library/useRate';
import { useStars } from '@ValenceClient/library/useStars';
import { theVersionsOf } from '@ValenceClient/library/theVersionsOf';
import { useConfirmHiding } from '@ValenceNative/library/useConfirmHiding';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { PluginPanels } from '@ValenceTv/components/PluginPanels/PluginPanels';
import { StarChoice } from '@ValenceTv/components/StarChoice/StarChoice';
import { CastRow } from '@ValenceTv/components/CastRow/CastRow';
import { ChoicePanel } from '@ValenceTv/components/ChoicePanel/ChoicePanel';
import { TitleSpread } from '@ValenceTv/components/TitleSpread/TitleSpread';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { useProgress } from '@ValenceTv/library/useProgress';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { tokens } from '@ValenceTv/theme/tokens';
import { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import { whereFrom } from '@ValenceClient/linking/whereFrom';
import { usePreferredCopy } from '@ValenceClient/linking/usePreferredCopy';
import type { FilmPageProps } from './FilmPage.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const STARRING = 4;

/**
 * A film's own page: everything about it beside its picture, and what can be done with it — carry on
 * from where this viewer left off, or start again, keep it on their list, give it stars from the panel
 * down the right, which Menu closes, or hide it, once asked. Where the library holds other cuts of it
 * the one to play is chosen from the same panel, and a trailer kept beside it plays in the player.
 * Beneath are the cast, each opening their own page.
 *
 * @param mediaId - The film.
 * @param viewerId - Who is watching, whose list it goes on.
 * @param onPlay - Told to play it, and from where.
 * @param onOpenPerson - Told whose page to open, from the cast.
 */
const FilmPage = ({ mediaId, viewerId, onPlay, onOpenPerson }: FilmPageProps) => {
  const { progress } = useProgress();
  const favourites = useFavourites(viewerId);
  const hiding = useHidden(viewerId);
  const rate = useRate(viewerId);
  const stars = useStars(viewerId, { mediaId });
  const [panel, setPanel] = useState<'rating' | 'version' | null>(null);
  const [chosenVersion, setChosenVersion] = useState<string | null>(null);
  const detail = useQuery(libraryQueries.detail(mediaId));
  const originOf = useOriginOf();
  const preferred = usePreferredCopy(detail.data, detail.data?.versions ?? []);

  useConfirmHiding(hiding);
  useMenuButton(
    panel === null
      ? null
      : () => {
          setPanel(null);
        },
    true,
  );
  const film = detail.data ?? null;

  if (film === null) {
    return (
      <View style={styles.waiting}>
        {detail.isPending ? (
          <ActivityIndicator size="large" color={tokens.colours.text} />
        ) : (
          <Text style={styles.problem}>{say('tv.filmPage.thisFilmCouldNotBeFound')}</Text>
        )}
      </View>
    );
  }

  const versions = film.versions ?? [];
  const offered = theVersionsOf(film.id, versions);
  const playing = versions.find((one) => one.id === (chosenVersion ?? preferred)) ?? null;
  const summary = playing ?? summariseDetail(film);
  const resume = resumeFor(
    progress,
    playing !== null && originOf(playing.libraryId) !== null ? film.id : summary.id,
  );
  const watched = progress.get(summary.id);
  const trailer =
    (film.extras ?? []).find((extra) => extra.extraKind === 'trailer' && extra.id !== film.id) ??
    null;
  const starring = (film.metadata.cast ?? []).slice(0, STARRING).map((member) => member.name);
  const genres = film.metadata.genres ?? [];

  const page = (
    <TitleSpread
      mediaId={film.id}
      name={film.title}
      hasLogo={film.metadata.hasLogo}
      stillPath={film.metadata.hasBackdrop ? artworkUrl(film.id, 'backdrop') : null}
      facts={joinFacts([
        whereFrom(originOf(film.libraryId)),
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
          : [say('common.starringValue', { value: starring.join(', ') })]),
        ...(genres.length === 0 ? [] : [genres.join(', ')]),
      ]}
      below={
        <>
          <CastRow cast={film.metadata.cast ?? []} onOpen={onOpenPerson} />
          <PluginPanels on="title" subjectId={film.id} />
        </>
      }
    >
      <ActionRow
        label={
          resume === null
            ? say('common.play')
            : say('common.resumeFromResume', { resume: formatDuration(resume) })
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
          label={say('tv.filmPage.playFromTheBeginning')}
          icon={RotateCcw}
          onPress={() => {
            onPlay(summary, 0);
          }}
        />
      )}

      {versions.length === 0 ? null : (
        <ActionRow
          label={say('common.whichVersionToPlay')}
          detail={offered.find((one) => one.id === summary.id)?.label ?? say('common.original')}
          icon={ChevronsUpDown}
          onPress={() => {
            setPanel('version');
          }}
        />
      )}

      {trailer === null ? null : (
        <ActionRow
          label={say('common.trailer')}
          icon={Film}
          onPress={() => {
            onPlay(trailer, 0);
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

      <ActionRow
        label={stars === null ? say('tv.rating.rateIt') : say('common.yourRating')}
        {...(stars === null ? {} : { detail: sayCount('common.count.stars', stars) })}
        icon={Star}
        onPress={() => {
          setPanel('rating');
        }}
      />

      <ActionRow
        label={say('common.hide')}
        icon={EyeOff}
        onPress={() => {
          hiding.ask(summariseDetail(film));
        }}
      />
    </TitleSpread>
  );

  return (
    <View style={styles.page}>
      {page}

      {panel === 'rating' ? (
        <StarChoice
          title={film.title}
          given={stars}
          onChoose={(chosen) => {
            rate({ mediaId: film.id }, chosen);
            setPanel(null);
          }}
        />
      ) : null}

      {panel === 'version' ? (
        <ChoicePanel
          title={say('common.whichVersionToPlay')}
          choices={offered.map((one) => ({ ...one, isCurrent: one.id === summary.id }))}
          onChoose={(id) => {
            setChosenVersion(id === film.id ? null : id);
            setPanel(null);
          }}
        />
      ) : null}
    </View>
  );
};

FilmPage.displayName = 'FilmPage';

const styles = StyleSheet.create({
  page: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { FilmPage };
