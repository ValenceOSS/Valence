import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { liveChannelLogoUrl } from '@ValenceClient/live/liveChannelLogoUrl';
import { channelInitials } from '@ValenceClient/live/channelInitials';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ChannelLogoProps } from './ChannelLogo.types';

/**
 * A channel's logo, read through the server, or the first letters of its name where it has none or
 * the logo will not load, so a channel whose host refuses it still has a tidy tile.
 *
 * @param channelId - The channel.
 * @param name - What the channel is called.
 * @param hasLogo - Whether the channel names a logo at all.
 * @param width - How wide the tile is.
 * @param height - How tall the tile is.
 */
const ChannelLogo = ({ channelId, name, hasLogo, width, height }: ChannelLogoProps) => {
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const isShown = hasLogo && failedFor !== channelId;

  return (
    <View style={[styles.tile, { width, height }]}>
      {isShown ? (
        <Artwork
          path={liveChannelLogoUrl(channelId)}
          fit="contain"
          style={styles.logo}
          onMissing={() => {
            setFailedFor(channelId);
          }}
        />
      ) : (
        <Text style={styles.initials}>{channelInitials(name).toUpperCase()}</Text>
      )}
    </View>
  );
};

ChannelLogo.displayName = 'ChannelLogo';

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colours.raised,
  },
  logo: { ...StyleSheet.absoluteFill, margin: tokens.space.xs, backgroundColor: 'transparent' },
  initials: { color: tokens.colours.muted, fontSize: tokens.type.small, fontWeight: '700' },
});

export { ChannelLogo };
