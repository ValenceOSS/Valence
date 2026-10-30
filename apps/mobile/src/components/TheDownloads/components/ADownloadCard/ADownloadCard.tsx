import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Words } from '@ValenceMobile/components/Words/Words';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ADownloadCardProps } from './ADownloadCard.types';

const POSTER_WIDE = 64;

const styles = StyleSheet.create({
  actions: { alignItems: 'center', flexDirection: 'row' },
  card: { borderRadius: 18, flexDirection: 'row', gap: 14, padding: 12 },
  poster: { borderRadius: 10, height: POSTER_WIDE * 1.5, width: POSTER_WIDE },
  words: { flex: 1, gap: 4, justifyContent: 'center' },
});

/**
 * One thing downloaded, on a solid card of its own: its poster, its name, what it is — its
 * quality, how big it is and how long it runs — where it stands, a bar of how far it has come while
 * it is on its way, and the things that can be done with it at the end.
 *
 * @param title - What it is called.
 * @param artwork - Its poster, kept on this phone or on the server, or nothing where there is none.
 * @param facts - Its quality, size and length, each where it is known.
 * @param says - Where it stands.
 * @param isFailed - Whether it went wrong, so where it stands is said as a problem.
 * @param fraction - How far it has come, while it is on its way.
 * @param progressLabel - What the bar is of, for somebody who cannot see it.
 * @param children - What can be done with it.
 */
const ADownloadCard = ({
  title,
  artwork,
  facts,
  says,
  isFailed,
  fraction,
  progressLabel,
  children,
}: ADownloadCardProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
      {artwork === null ? (
        <View style={[styles.poster, { backgroundColor: colours.surfaceRaised }]} />
      ) : (
        <ARemotePicture
          style={[styles.poster, { backgroundColor: colours.surfaceRaised }]}
          uri={artwork}
        />
      )}

      <View style={styles.words}>
        <Words isStrong lines={2}>
          {title}
        </Words>
        {facts.length === 0 ? null : (
          <Words size="small" tone="muted" lines={1}>
            {facts.join(' · ')}
          </Words>
        )}
        <Words size="small" tone={isFailed ? 'danger' : 'muted'} lines={2}>
          {says}
        </Words>
        {fraction === null ? null : <HowFar fraction={fraction} label={progressLabel} />}
      </View>

      <View style={styles.actions}>{children}</View>
    </View>
  );
};

ADownloadCard.displayName = 'ADownloadCard';

export { ADownloadCard };
