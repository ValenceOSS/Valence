import { StyleSheet, Text, View } from 'react-native';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { describeDownload } from '@ValenceTv/requests/describeDownload';
import { tokens } from '@ValenceTv/theme/tokens';
import type { DownloadReadoutProps } from './DownloadReadout.types';

/**
 * How a download is going, drawn: a bar filling as it arrives, and beneath it how much has arrived,
 * how fast and how long is left.
 *
 * @param progress - How the download is going.
 * @param isOnWhite - Whether it sits on a white row, where its words are drawn dark.
 */
const DownloadReadout = ({ progress, isOnWhite = false }: DownloadReadoutProps) => (
  <View style={styles.readout}>
    <ProgressLine fraction={progress.progress} isInline />

    <Text numberOfLines={1} style={[styles.words, isOnWhite && styles.onWhite]}>
      {describeDownload(progress)}
    </Text>
  </View>
);

DownloadReadout.displayName = 'DownloadReadout';

const styles = StyleSheet.create({
  readout: { gap: tokens.space.xs },
  words: { color: tokens.colours.muted, fontSize: tokens.type.small },
  onWhite: { color: tokens.colours.onWhite },
});

export { DownloadReadout };
