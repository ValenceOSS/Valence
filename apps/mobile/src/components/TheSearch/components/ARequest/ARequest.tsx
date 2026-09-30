import { useEffect } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { mayBeInTheLibrary } from '@ValenceClient/requests/mayBeInTheLibrary';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { describeDownloadLine } from '@ValenceClient/requests/describeDownloadLine';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Words } from '@ValenceMobile/components/Words/Words';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import type { ARequestProps } from './ARequest.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  poster: { borderRadius: 8, height: 90, width: 60 },
  row: { flexDirection: 'row', gap: 14 },
  words: { flex: 1, gap: 4, justifyContent: 'center' },
  fix: { alignSelf: 'flex-start', marginLeft: 74, marginTop: 6 },
});

/**
 * One thing somebody asked for — a film, a programme, music or a book — and how far it has got: while
 * it downloads, a bar and how much has come, how fast and how long is left; and a link to what
 * explains its problem where it has one. A film or a programme opens its page when pressed; music
 * and books have no page on a phone, so they are only shown. Where some of it may have arrived, its
 * standing is read ahead, so pressing it opens its page in the library straight away rather than the
 * page that would ask for it.
 *
 * @param request - What was asked for.
 * @param progress - Everything downloading, of which this may be some.
 * @param myId - Who is looking, so their own requests say so.
 * @param onAsk - Told it was pressed, to open its page.
 */
const ARequest = ({ request, progress, myId, onAsk }: ARequestProps) => {
  const colours = useTheColours();
  const badge = describeRequestBadge(request);
  const across = describeRequestProgress(request);
  const going = request.state === 'downloading' ? progressOfRequest(request, progress) : null;
  const saidOfGoing = going === null ? null : describeDownloadLine(going);
  const { kind, tmdbId } = request;
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
    <View style={styles.row}>
      <Image
        style={[styles.poster, { backgroundColor: colours.surfaceRaised }]}
        {...(request.posterUrl === null
          ? {}
          : { source: { uri: pictureOnThisServer(request.posterUrl) } })}
        accessibilityIgnoresInvertColors
      />

      <View style={styles.words}>
        <Words lines={1}>
          {request.year === null ? request.title : `${request.title} (${request.year.toString()})`}
        </Words>

        <Words size="small" tone={badge.tone === 'danger' ? 'danger' : 'accent'}>
          {badge.detail === null ? badge.label : `${badge.label} · ${badge.detail}`}
        </Words>

        {across === null ? null : (
          <Words size="small" tone="muted">
            {across}
          </Words>
        )}

        <Words size="small" tone="muted">
          {request.requestedBy.id === myId
            ? say('common.askedByYou')
            : say('common.askedByName', { name: request.requestedBy.name })}
        </Words>

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
      </View>
    </View>
  );

  return (
    <View>
      {whatAPhoneAsksFor(kind) && tmdbId !== null ? (
        <Button
          tone="bare"
          label={request.title}
          onPress={() => {
            onAsk(kind, tmdbId.toString());
          }}
        >
          {card}
        </Button>
      ) : (
        card
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
  );
};

ARequest.displayName = 'ARequest';

export { ARequest };
