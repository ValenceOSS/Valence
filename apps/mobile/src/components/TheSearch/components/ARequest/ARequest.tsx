import { askersOf } from '@ValenceContracts/functions/askersOf';
import { describeAskers } from '@ValenceClient/requests/describeAskers';
import { useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { useQueryClient } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { mayBeInTheLibrary } from '@ValenceClient/requests/mayBeInTheLibrary';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { describeDownloadLine } from '@ValenceClient/requests/describeDownloadLine';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ABadge } from '@ValenceMobile/components/ABadge/ABadge';
import type { ABadgeTone } from '@ValenceMobile/components/ABadge/ABadge.types';
import type { StatusTone } from '@ValenceClient/status/StatusTone';
import { ARequesterFaces } from '@ValenceMobile/components/TheSearch/components/ARequest/components/ARequesterFaces/ARequesterFaces';
import { theColours } from '@ValenceMobile/theme/theColours';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Words } from '@ValenceMobile/components/Words/Words';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import type { ARequestProps } from './ARequest.types';
import { say } from '@ValenceI18n/say';

const POSTER_WIDE = 88;

const TONES = {
  waiting: 'quiet',
  busy: 'busy',
  warning: 'busy',
  success: 'success',
  danger: 'danger',
  quiet: 'quiet',
} as const satisfies Record<StatusTone, ABadgeTone>;

const styles = StyleSheet.create({
  askers: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 2 },
  askersSaid: { flexShrink: 1 },
  card: { borderRadius: 20, flexDirection: 'row', gap: 14, padding: 12 },
  fix: { alignSelf: 'flex-start', marginTop: 4 },
  poster: { borderRadius: 12, height: POSTER_WIDE * 1.5, width: POSTER_WIDE },
  status: { alignItems: 'flex-start', gap: 6 },
  words: { flex: 1, gap: 8, justifyContent: 'center' },
});

/**
 * One thing somebody asked for — a film, a programme, music or a book — on a solid card of its own:
 * its poster large, its name, where it stands as a badge in its status's colour with the line about
 * it beneath, while it downloads a bar and how much has come, how fast and how long is left, and
 * the faces of whoever asked for it with their names; and a link to what explains its problem
 * where it has one. A film or a programme opens its page when pressed; music
 * and books have no page on a phone, so they are only shown. Where some of it may have arrived, its
 * standing is read ahead, so pressing it opens its page in the library straight away rather than the
 * page that would ask for it.
 *
 * @param request - What was asked for.
 * @param progress - Everything downloading, of which this may be some.
 * @param me - Who is looking, so their own requests say so.
 * @param faces - Every face on this server, to draw whoever asked with theirs.
 * @param onAsk - Told it was pressed, to open its page.
 */
const ARequest = ({ request, progress, me, faces, onAsk }: ARequestProps) => {
  const colours = useTheColours();
  const cardColour = colours.surface === theColours.dark.surface ? '#1c1c1e' : '#ffffff';
  const askers = askersOf(request);
  const badge = describeRequestBadge(request);
  const across = describeRequestProgress(request);
  const going = request.state === 'downloading' ? progressOfRequest(request, progress) : null;
  const saidOfGoing = going === null ? null : describeDownloadLine(going);
  const { kind, tmdbId } = request;
  const openAs =
    tmdbId !== null
      ? tmdbId.toString()
      : (request.musicBrainzId ?? request.openLibraryId?.toString() ?? null);
  const { help } = badge;
  const cache = useQueryClient();
  const readAheadAs =
    whatAPhoneAsksFor(kind) && tmdbId !== null && mayBeInTheLibrary(request)
      ? tmdbId.toString()
      : null;

  useEffect(() => {
    if (readAheadAs !== null) {
      void cache.prefetchQuery(requestsQueries.askable(kind, readAheadAs));
    }
  }, [cache, kind, readAheadAs]);
  const card = (
    <View style={[styles.card, { backgroundColor: cardColour }]}>
      {request.posterUrl === null ? (
        <View style={[styles.poster, { backgroundColor: colours.surfaceRaised }]} />
      ) : (
        <ARemotePicture
          style={[styles.poster, { backgroundColor: colours.surfaceRaised }]}
          uri={pictureOnThisServer(request.posterUrl)}
        />
      )}

      <View style={styles.words}>
        <View>
          <Words size="heading" lines={2}>
            {request.title}
          </Words>
          {request.year === null ? null : <Words tone="muted">{request.year.toString()}</Words>}
        </View>

        <View style={styles.status}>
          <ABadge tone={TONES[badge.tone]}>{badge.label}</ABadge>
          {badge.detail === null ? null : (
            <Words size="small" tone={badge.tone === 'danger' ? 'danger' : 'muted'} lines={2}>
              {badge.detail}
            </Words>
          )}
        </View>

        {across === null ? null : (
          <Words size="small" tone="muted">
            {across}
          </Words>
        )}

        {going === null ? null : (
          <HowFar
            fraction={going.progress}
            label={say('common.howFarTitleHasDownloaded', { title: request.title })}
          />
        )}

        {saidOfGoing === null ? null : (
          <Words size="small" tone="muted">
            {saidOfGoing}
          </Words>
        )}

        {askers.length === 0 ? null : (
          <View style={styles.askers}>
            <ARequesterFaces askers={askers} faces={faces} ring={cardColour} />
            <View style={styles.askersSaid}>
              <Words tone="muted" lines={1}>
                {describeAskers(askers, me)}
              </Words>
            </View>
          </View>
        )}

        {help === null || help === undefined ? null : (
          <View style={styles.fix}>
            <Button
              tone="bare"
              label={say('common.howToFixThis')}
              onPress={() => {
                void Linking.openURL(help);
              }}
            >
              <Words size="small" tone="accent">
                {say('common.howToFixThis')}
              </Words>
            </Button>
          </View>
        )}
      </View>
    </View>
  );

  return openAs === null ? (
    card
  ) : (
    <Button
      tone="bare"
      label={request.title}
      onPress={() => {
        onAsk(kind, openAs);
      }}
    >
      {card}
    </Button>
  );
};

ARequest.displayName = 'ARequest';

export { ARequest };
