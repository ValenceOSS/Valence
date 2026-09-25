import { StyleSheet, Text, View } from 'react-native';
import { nameTheStanding } from '@ValenceClient/requests/nameTheStanding';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { DownloadReadout } from '@ValenceTv/components/DownloadReadout/DownloadReadout';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { RequestRowProps } from './RequestRow.types';

const POSTER = { width: 80, height: 120 };

/**
 * One thing that has been asked for: its poster and name, where it has got to — waiting for
 * approval, downloading, arriving, in the library — and, while it downloads, how far through it is,
 * how fast it is arriving and how long is left. Someone else's request says whose it is.
 *
 * @param request - What was asked for.
 * @param going - How its download is going, while it downloads.
 * @param isSomeoneElses - Whether somebody other than this viewer asked for it.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param onPress - Told when it is chosen, to open its page.
 */
const RequestRow = ({
  request,
  going,
  isSomeoneElses,
  hasPreferredFocus,
  onPress,
}: RequestRowProps) => {
  const standing = nameTheStanding({
    status: request.state === 'available' ? 'library' : 'requested',
    mediaId: request.mediaId,
    requestId: request.id,
    requestState: request.state,
  });
  const where = standing?.label ?? '';

  return (
    <Focusable
      label={`${request.title}, ${where}`}
      scale={1.02}
      isAnchoredLeft
      hasPreferredFocus={hasPreferredFocus}
      onPress={() => {
        onPress(request);
      }}
    >
      {(isFocused) => {
        const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;

        return (
          <View style={[styles.row, isFocused && styles.focused]}>
            <View style={[styles.poster, POSTER]}>
              <Artwork path={request.posterUrl} style={StyleSheet.absoluteFill} />
            </View>

            <View style={styles.words}>
              <Text numberOfLines={1} style={[styles.title, { color: ink }]}>
                {joinFacts([request.title, request.year?.toString()])}
              </Text>

              <Text numberOfLines={1} style={[styles.where, isFocused && { color: ink }]}>
                {isSomeoneElses
                  ? joinFacts([
                      where,
                      say('tv.requestRow.askedForBy', { name: request.requestedBy.name }),
                    ])
                  : where}
              </Text>

              {going === null ? null : <DownloadReadout progress={going} isOnWhite={isFocused} />}
            </View>
          </View>
        );
      }}
    </Focusable>
  );
};

RequestRow.displayName = 'RequestRow';

const styles = StyleSheet.create({
  row: {
    width: 1100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    padding: tokens.space.sm,
    borderRadius: tokens.radii.lg,
  },
  focused: { backgroundColor: '#ffffff' },
  poster: {
    borderRadius: tokens.radii.sm,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  words: { flex: 1, gap: tokens.space.xs },
  title: { fontSize: tokens.type.body, fontWeight: '600' },
  where: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

export { RequestRow };
