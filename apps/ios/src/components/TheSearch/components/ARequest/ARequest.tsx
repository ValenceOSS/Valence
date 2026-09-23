import { Image, StyleSheet, View } from 'react-native';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { Button } from '@ValencePhone/components/Button/Button';
import { HowFar } from '@ValencePhone/components/HowFar/HowFar';
import { Words } from '@ValencePhone/components/Words/Words';
import { whatAPhoneAsksFor } from '@ValencePhone/components/TheSearch/whatAPhoneAsksFor';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ARequestProps } from './ARequest.types';

const styles = StyleSheet.create({
  poster: { borderRadius: 8, height: 90, width: 60 },
  row: { flexDirection: 'row', gap: 14 },
  words: { flex: 1, gap: 4, justifyContent: 'center' },
});

/**
 * One thing somebody asked for, and how far it has got.
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
  const { kind, tmdbId } = request;

  if (!whatAPhoneAsksFor(kind) || tmdbId === null) {
    return null;
  }

  return (
    <Button
      tone="bare"
      label={request.title}
      onPress={() => {
        onAsk(kind, tmdbId.toString());
      }}
    >
      <View style={styles.row}>
        <Image
          style={[styles.poster, { backgroundColor: colours.surfaceRaised }]}
          {...(request.posterUrl === null ? {} : { source: { uri: request.posterUrl } })}
          accessibilityIgnoresInvertColors
        />

        <View style={styles.words}>
          <Words lines={1}>
            {request.year === null
              ? request.title
              : `${request.title} (${request.year.toString()})`}
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
              ? 'Asked by you'
              : `Asked by ${request.requestedBy.name}`}
          </Words>

          {going === null ? null : (
            <HowFar fraction={going.progress} label={`How far ${request.title} has downloaded`} />
          )}
        </View>
      </View>
    </Button>
  );
};

ARequest.displayName = 'ARequest';

export { ARequest };
