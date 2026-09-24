import { Cast, Check, Smartphone } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ADevicesSheetProps } from './ADevicesSheet.types';

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 12 },
  said: { flex: 1, gap: 2 },
});

/**
 * Where the music plays, as the web's devices panel offers it: this phone, and every other Valence
 * this profile has open — a browser, the desktop app, a television, another phone — each saying what
 * it is playing. Picking another hands the music over, carrying on from the same moment in the same
 * song with the rest of the queue, and this phone becomes its remote; picking this phone brings the
 * music back here from where it had got to.
 *
 * @param isOpen - Whether it is out.
 * @param onClose - Told to put it away.
 */
const ADevicesSheet = ({ isOpen, onClose }: ADevicesSheetProps) => {
  const colours = useTheColours();
  const { player, state } = useTheMusic();
  const shown = useWhatIsPlaying(state);
  const devices = useQuery({ ...musicQueries.devices(), enabled: isOpen });
  const here = platformInUse().thisClientId();
  const others = (devices.data ?? []).filter((device) => device.clientId !== here);
  const playingOn = state.remote?.clientId ?? null;

  /**
   * One place the music could play.
   *
   * @param place - Its name, what it is playing, how it is drawn, and what picking it does.
   * @returns Its row.
   */
  const aRow = (place: {
    id: string;
    label: string;
    detail: string;
    of: AGlyph;
    isChosen: boolean;
    onPick: () => void;
  }) => (
    <Button
      key={place.id}
      tone="bare"
      label={`Play on ${place.label}`}
      isChosen={place.isChosen}
      onPress={() => {
        place.onPick();
        onClose();
      }}
    >
      <View style={styles.row}>
        <Icon of={place.of} size={24} colour={colours.text} />
        <View style={styles.said}>
          <Words lines={1} {...(place.isChosen ? { isStrong: true } : {})}>
            {place.label}
          </Words>
          <Words size="small" tone="muted" lines={1}>
            {place.detail}
          </Words>
        </View>
        {place.isChosen ? <Icon of={Check} size={20} colour={colours.text} /> : null}
      </View>
    </Button>
  );

  return (
    <ASheet isOpen={isOpen} title="Play on" onClose={onClose}>
      {aRow({
        id: here,
        label: platformInUse().describeThisClient(),
        detail: 'This iPhone',
        of: Smartphone,
        isChosen: playingOn === null,
        onPick: () => {
          if (playingOn !== null) {
            player.playHere(shown?.positionSeconds ?? 0, shown?.isPlaying ?? true);
          }
        },
      })}

      {others.map((device) =>
        aRow({
          id: device.clientId,
          label: device.label,
          detail:
            device.nowPlaying === null
              ? 'Not playing'
              : `${device.nowPlaying.isPlaying ? 'Playing' : 'Paused on'} ${device.nowPlaying.title}`,
          of: Cast,
          isChosen: playingOn === device.clientId,
          onPick: () => {
            if (playingOn !== device.clientId) {
              player.playOn({ clientId: device.clientId, label: device.label });
            }
          },
        }),
      )}

      {devices.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

      {!devices.isPending && others.length === 0 ? (
        <Words tone="muted">
          No other Valence is open on this profile. Open Valence on a computer, a television or
          another phone and it will be here.
        </Words>
      ) : null}
    </ASheet>
  );
};

ADevicesSheet.displayName = 'ADevicesSheet';

export { ADevicesSheet };
