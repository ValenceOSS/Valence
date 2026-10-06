import { showActionSheet } from '@ValenceMobile/platform/showActionSheet';
import { Download, MoreHorizontal } from '@keyline-icons/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AMissingSongProps } from './AMissingSong.types';
import { say } from '@ValenceI18n/say';

const COVER = 44;

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    height: COVER,
    justifyContent: 'center',
    overflow: 'hidden',
    width: COVER,
  },
  faded: { height: '100%', opacity: 0.4, position: 'absolute', width: '100%' },
  lead: { alignItems: 'center', justifyContent: 'center', minWidth: 24 },
  menu: { padding: 8 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 8 },
  said: { flex: 1, gap: 2 },
  side: { alignItems: 'center', flexDirection: 'row', gap: 12 },
});

/**
 * A song a playlist holds that the library does not have yet, drawn in its place among the songs it
 * does, as the web draws it: muted, with its album's cover faded under a download mark where the
 * list shows covers. Pressing it
 * finds its album to request, where that may be done, and its menu takes it out of a playlist of
 * yours.
 *
 * @param title - The song.
 * @param artist - Who it is by.
 * @param hasCover - Whether the list shows covers.
 * @param coverUrl - Its album's cover, where one is known.
 * @param onChoose - Finds its album to request, where somebody may.
 * @param onRemove - Takes it out, where this is a playlist of yours.
 */
const AMissingSong = ({
  title,
  artist,
  hasCover,
  coverUrl,
  onChoose,
  onRemove,
}: AMissingSongProps) => {
  const colours = useTheColours();
  const [isCoverMissing, setIsCoverMissing] = useState(false);
  const said = (
    <View style={styles.side}>
      {hasCover ? (
        <View
          style={[
            styles.cover,
            {
              backgroundColor: colours.surfaceRaised,
              borderColor: colours.border,
              borderStyle: 'dashed',
            },
          ]}
        >
          {coverUrl === null || isCoverMissing ? null : (
            <ARemotePicture
              style={styles.faded}
              uri={coverUrl}
              onMissing={() => {
                setIsCoverMissing(true);
              }}
            />
          )}
          <Icon of={Download} size={18} colour={colours.textMuted} />
        </View>
      ) : (
        <View style={styles.lead}>
          <Icon of={Download} size={16} colour={colours.textMuted} />
        </View>
      )}

      <View style={styles.said}>
        <Words lines={1} tone="muted">
          {title}
        </Words>
        <Words size="small" tone="muted" lines={1}>
          {say('common.artistNotInYourLibrary', { artist })}
        </Words>
      </View>
    </View>
  );
  const choices = [
    ...(onChoose === undefined ? [] : [{ label: say('common.requestItsAlbum'), run: onChoose }]),
    ...(onRemove === undefined
      ? []
      : [{ label: say('common.removeFromThisPlaylist'), run: onRemove }]),
  ];

  return (
    <View style={styles.row}>
      <View style={styles.said}>
        {onChoose === undefined ? (
          said
        ) : (
          <Button
            tone="bare"
            label={say('common.requestTheAlbumTitleIsOn', { title })}
            onPress={onChoose}
          >
            {said}
          </Button>
        )}
      </View>

      {choices.length === 0 ? null : (
        <Button
          tone="bare"
          label={say('common.moreForTitle', { title })}
          onPress={() => {
            showActionSheet(
              {
                title,
                options: [...choices.map((choice) => choice.label), say('common.cancel')],
                cancelButtonIndex: choices.length,
                ...(onRemove === undefined ? {} : { destructiveButtonIndex: choices.length - 1 }),
              },
              (picked) => {
                choices[picked]?.run();
              },
            );
          }}
        >
          <View style={styles.menu}>
            <Icon of={MoreHorizontal} size={20} colour={colours.textMuted} />
          </View>
        </Button>
      )}
    </View>
  );
};

AMissingSong.displayName = 'AMissingSong';

export { AMissingSong };
