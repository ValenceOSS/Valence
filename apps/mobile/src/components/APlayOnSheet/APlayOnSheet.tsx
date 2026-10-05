import { StyleSheet, View } from 'react-native';
import { ChevronRight, Monitor } from '@keyline-icons/react-native';
import { controlDevice } from '@ValenceClient/video/controlledDevice';
import { sendVideoCommand } from '@ValenceClient/video/videoDevices';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { APlayOnSheetProps } from './APlayOnSheet.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  device: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  devices: { gap: 8 },
  said: { flex: 1, gap: 2 },
});

/**
 * Sends a title to one of this person's televisions, as the web's Play on does, and makes this phone
 * that television's remote. A television shows here once Valence is open on it and signed in to the
 * same account.
 *
 * @param media - The title to send, or null while the sheet is put away.
 * @param startSeconds - Where to start it.
 * @param onClose - Told to put the sheet away.
 */
const APlayOnSheet = ({ media, startSeconds, onClose }: APlayOnSheetProps) => {
  const colours = useTheColours();
  const televisions = useVideoDevices(media !== null).filter((device) => device.kind === 'tv');

  return (
    <ASheet isOpen={media !== null} title={say('common.playOn')} onClose={onClose}>
      {televisions.length === 0 ? (
        <Words tone="muted">{say('screens.playOnDialog.openValenceOnYourAppleTV')}</Words>
      ) : (
        <View style={styles.devices}>
          {televisions.map((device) => (
            <Button
              key={device.clientId}
              tone="bare"
              label={say('common.playOnLabel', { label: device.label })}
              onPress={() => {
                if (media === null) {
                  return;
                }

                void sendVideoCommand(device.clientId, {
                  kind: 'play',
                  mediaId: media.id,
                  startSeconds: Math.floor(startSeconds),
                });
                controlDevice({ clientId: device.clientId, label: device.label });
                onClose();
              }}
            >
              <View style={[styles.device, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
                <Icon of={Monitor} colour={colours.text} />
                <View style={styles.said}>
                  <Words lines={1}>{device.label}</Words>
                  <Words size="small" tone="muted" lines={1}>
                    {device.nowWatching === null
                      ? say('screens.playOnDialog.notPlayingAnything')
                      : `${device.nowWatching.isPlaying ? say('common.playing') : say('common.pausedOn')} ${device.nowWatching.title}`}
                  </Words>
                </View>
                <Icon of={ChevronRight} colour={colours.textMuted} />
              </View>
            </Button>
          ))}
        </View>
      )}
    </ASheet>
  );
};

APlayOnSheet.displayName = 'APlayOnSheet';

export { APlayOnSheet };
