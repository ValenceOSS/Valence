import { Image, Linking, StyleSheet, View } from 'react-native';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Words } from '@ValenceMobile/components/Words/Words';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ARequestProps } from './ARequest.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  poster: { borderRadius: 8, height: 90, width: 60 },
  row: { flexDirection: 'row', gap: 14 },
  words: { flex: 1, gap: 4, justifyContent: 'center' },
  fix: { alignSelf: 'flex-start', marginLeft: 74, marginTop: 6 },
});

/**
 * One thing somebody asked for, and how far it has got, with a link to what explains its problem
 * where it has one.
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

  const { help } = badge;

  return (
    <View>
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
                ? say('phone.aRequest.askedByYou')
                : say('phone.aRequest.askedBy', { name: request.requestedBy.name })}
            </Words>

            {going === null ? null : (
              <HowFar
                fraction={going.progress}
                label={say('phone.aRequest.howFarDownloaded', { title: request.title })}
              />
            )}
          </View>
        </View>
      </Button>

      {help === null || help === undefined ? null : (
        <View style={styles.fix}>
          <Button
            tone="bare"
            label={say('phone.aRequest.howToFix')}
            onPress={() => {
              void Linking.openURL(help);
            }}
          >
            <Words size="small" tone="accent">
              {say('phone.aRequest.howToFix')}
            </Words>
          </Button>
        </View>
      )}
    </View>
  );
};

ARequest.displayName = 'ARequest';

export { ARequest };
