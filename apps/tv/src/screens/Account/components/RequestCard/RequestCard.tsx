import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nameTheStanding } from '@ValenceClient/requests/nameTheStanding';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { partsOfDownload } from '@ValenceTv/requests/partsOfDownload';
import { tokens } from '@ValenceTv/theme/tokens';
import type { RequestCardProps } from './RequestCard.types';

const POSTER = { width: 180, height: 270 };

/**
 * One of this viewer's requests on their profile: its poster, its name, and where it stands — or,
 * while it downloads, how far through it is, with a line along the foot of the poster filling as it
 * arrives.
 *
 * @param request - What was asked for.
 * @param going - How its download is going, while it downloads.
 * @param onPress - Told when it is chosen, to open its page.
 * @param onFocus - Told when the remote lands on it.
 */
const RequestCard = ({ request, going, onPress, onFocus }: RequestCardProps) => {
  const standing = nameTheStanding({
    status: request.state === 'available' ? 'library' : 'requested',
    mediaId: request.mediaId,
    requestId: request.id,
    requestState: request.state,
  });
  const where =
    going === null
      ? (standing?.label ?? '')
      : `${standing?.label ?? 'Downloading'} · ${partsOfDownload(going).percent}`;

  const poster = useMemo(
    () => (
      <View style={[styles.poster, POSTER]}>
        <Artwork path={request.posterUrl} style={StyleSheet.absoluteFill} />
        {going === null ? null : <ProgressLine fraction={going.progress} />}
      </View>
    ),
    [request.posterUrl, going],
  );

  return (
    <Focusable
      label={`${request.title}, ${where}`}
      shadow={{ height: POSTER.height, cornerRadius: tokens.radii.lg }}
      scale={1.08}
      onFocus={onFocus}
      onPress={() => {
        onPress(request);
      }}
    >
      <View style={{ width: POSTER.width }}>
        {poster}

        <Text numberOfLines={1} style={styles.title}>
          {request.title}
        </Text>
        <Text numberOfLines={1} style={styles.where}>
          {where}
        </Text>
      </View>
    </Focusable>
  );
};

RequestCard.displayName = 'RequestCard';

const styles = StyleSheet.create({
  poster: {
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  title: {
    marginTop: tokens.space.sm,
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
  },
  where: { color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
});

export { RequestCard };
