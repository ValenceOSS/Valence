import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { Pause, Play, Smartphone, Trash2 } from 'lucide-react-native';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { forgetDownload } from '@ValenceClient/downloads/fetchDownloads';
import { dropAFile, keepAFile, pauseAFile } from '@ValenceClient/downloads/keepingFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { Button } from '@ValencePhone/components/Button/Button';
import { HowFar } from '@ValencePhone/components/HowFar/HowFar';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { Download } from '@ValenceContracts/schemas/Download';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { TheDownloadsProps } from './TheDownloads.types';

const styles = StyleSheet.create({
  act: { padding: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  words: { flex: 1, gap: 3 },
});

type ARow = { id: string; title: string; download: Download | null; held: HeldFile | null };

/**
 * What has been downloaded, as the web's downloads list: what the server is preparing, what is
 * ready to fetch, and what this phone keeps — how far each has got, a way to pause and pick up a
 * fetch, to watch what is here, to take it off the phone, and, asked first, to have the server
 * forget it altogether.
 *
 * What the phone keeps is listed even where the server cannot be reached, since that is when it is
 * wanted.
 *
 * @param onWatch - Told to play a film this phone keeps.
 * @param onBack - Told somebody is done with it, where it was opened from somewhere rather than
 *   being a tab of its own.
 */
const TheDownloads = ({ onWatch, onBack }: TheDownloadsProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const downloads = useQuery(downloadQueries.all());
  const held = useHeldFiles();
  const heldById = new Map(held.map((file) => [file.downloadId, file]));
  const listed = new Set((downloads.data ?? []).map((download) => download.id));
  const rows: ARow[] = [
    ...(downloads.data ?? []).map((download) => ({
      id: download.id,
      title:
        download.seriesTitle === null
          ? download.title
          : `${download.seriesTitle} — ${download.title}`,
      download,
      held: heldById.get(download.id) ?? null,
    })),
    ...held
      .filter((file) => !listed.has(file.downloadId))
      .map((file) => ({ id: file.downloadId, title: file.title, download: null, held: file })),
  ];

  const reread = () => cache.invalidateQueries({ queryKey: downloadQueries.all().queryKey });

  const forget = (row: ARow) => {
    Alert.alert(
      `Forget ${row.title}?`,
      'It comes off this phone, and the server stops keeping it.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Forget it',
          style: 'destructive',
          onPress: () => {
            void dropAFile(row.id)
              .then(async () => (row.download === null ? true : forgetDownload(row.id)))
              .then(reread);
          },
        },
      ],
    );
  };

  const drawn = rows.map((row) => {
    const { download, held: file } = row;
    const fraction =
      file !== null && file.state !== 'here'
        ? file.ofBytes === null || file.ofBytes === 0
          ? 0
          : file.bytes / file.ofBytes
        : download?.state === 'preparing'
          ? download.progress
          : null;
    const says =
      file?.state === 'here'
        ? 'On this phone'
        : file?.state === 'fetching'
          ? [
              'Fetching',
              file.ofBytes === null
                ? null
                : `${formatBytes(file.bytes)} of ${formatBytes(file.ofBytes)}`,
              file.bytesPerSecond === null ? null : `${formatBytes(file.bytesPerSecond)}/s`,
            ]
              .filter((part) => part !== null)
              .join(' · ')
          : file?.state === 'paused'
            ? 'Paused'
            : file?.state === 'failed'
              ? (file.failure ?? 'Could not be fetched')
              : download?.state === 'preparing'
                ? 'The server is preparing it'
                : download?.state === 'ready'
                  ? 'Ready to fetch'
                  : download?.state === 'failed'
                    ? (download.failure ?? 'Could not be prepared')
                    : 'Waiting';

    return (
      <View key={row.id} style={{ gap: 6 }}>
        <View style={styles.row}>
          <View style={styles.words}>
            <Words lines={2}>{row.title}</Words>
            <Words size="small" tone={file?.state === 'failed' ? 'danger' : 'muted'}>
              {says}
            </Words>
          </View>

          {file?.state === 'here' ? (
            <Button
              tone="bare"
              label={`Watch ${row.title}`}
              onPress={() => {
                onWatch(file);
              }}
            >
              <View style={styles.act}>
                <Icon of={Play} size={20} colour={colours.accent} isFilled />
              </View>
            </Button>
          ) : null}

          {file?.state === 'fetching' || file?.state === 'paused' ? (
            <Button
              tone="bare"
              label={
                file.state === 'paused' ? `Carry on fetching ${row.title}` : `Pause ${row.title}`
              }
              onPress={() => {
                void pauseAFile(row.id, file.state !== 'paused');
              }}
            >
              <View style={styles.act}>
                <Icon of={file.state === 'paused' ? Play : Pause} size={20} colour={colours.text} />
              </View>
            </Button>
          ) : null}

          {file === null && download?.state === 'ready' ? (
            <Button
              tone="bare"
              label={`Keep ${row.title} on this phone`}
              onPress={() => {
                void keepAFile(download);
              }}
            >
              <View style={styles.act}>
                <Icon of={Smartphone} size={20} colour={colours.accent} />
              </View>
            </Button>
          ) : null}

          <Button
            tone="bare"
            label={`Forget ${row.title}`}
            onPress={() => {
              forget(row);
            }}
          >
            <View style={styles.act}>
              <Icon of={Trash2} size={18} colour={colours.textMuted} />
            </View>
          </Button>
        </View>

        {fraction === null ? null : (
          <HowFar fraction={fraction} label={`How far ${row.title} has got`} />
        )}
      </View>
    );
  });

  return (
    <Screen scrolls {...(onBack === undefined ? {} : { onBack })}>
      <Words size="title">Downloads</Words>

      {rows.length === 0 ? (
        <Words tone="muted">
          Nothing downloaded yet. Download a film from its page to watch it without the server.
        </Words>
      ) : (
        drawn
      )}
    </Screen>
  );
};

TheDownloads.displayName = 'TheDownloads';

export { TheDownloads };
