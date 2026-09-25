import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { partsOfDownload } from '@ValenceTv/requests/partsOfDownload';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { DownloadPanelProps } from './DownloadPanel.types';

const BAR_HEIGHT = 10;

/**
 * A download in progress, given a panel of its own on a title's page: where it stands and how far
 * through it is in large figures, a bar across the whole panel filling as it arrives, and beneath,
 * how much has arrived, how fast and how long is left, each named, with a small spinner in the
 * corner to say it is still working. It is as wide as the page's action rows and lines up with
 * their words.
 *
 * @param label - Where the request stands, such as Downloading to library.
 * @param progress - How the download is going.
 */
const DownloadPanel = ({ label, progress }: DownloadPanelProps) => {
  const { percent, arrived, speed, left } = partsOfDownload(progress);
  const done = Math.min(Math.max(progress.progress, 0), 1);
  const facts = [
    { name: say('tv.downloadPanel.downloaded'), value: arrived },
    { name: say('tv.downloadPanel.speed'), value: speed },
    { name: say('tv.downloadPanel.timeLeft'), value: left },
  ].filter((fact) => fact.value !== null);

  return (
    <View style={styles.panel}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>

        <Text style={styles.percent}>{percent}</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { flex: done }]} />
        <View style={{ flex: 1 - done }} />
      </View>

      <View style={styles.foot}>
        <View style={styles.facts}>
          {facts.map((fact) => (
            <View key={fact.name} style={styles.fact}>
              <Text style={styles.factName}>{fact.name}</Text>
              <Text numberOfLines={1} style={styles.factValue}>
                {fact.value}
              </Text>
            </View>
          ))}
        </View>

        <ActivityIndicator size="small" color={tokens.colours.muted} />
      </View>
    </View>
  );
};

DownloadPanel.displayName = 'DownloadPanel';

const styles = StyleSheet.create({
  panel: {
    width: tokens.ACTION_WIDTH,
    padding: tokens.space.md,
    gap: tokens.space.sm,
    borderRadius: tokens.radii.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: tokens.space.xs,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '700' },
  percent: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  track: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  fill: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: tokens.colours.accent,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: tokens.space.xs,
  },
  facts: { flexDirection: 'row', gap: tokens.space.lg },
  fact: { gap: 2 },
  factName: { color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
  factValue: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '600' },
});

export { DownloadPanel };
