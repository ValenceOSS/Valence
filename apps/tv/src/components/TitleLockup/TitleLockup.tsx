import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TitleLockupProps } from './TitleLockup.types';

const LOGO = { width: 640, height: 200 };

/**
 * A title's name as its designer lettered it, or set in type where there is no logo or it will not
 * load.
 *
 * @param mediaId - The title whose logo it is, or nothing for a title the library does not
 *   have, which is named in words.
 * @param name - What it is called.
 * @param hasLogo - Whether the server holds a logo for it.
 * @param logoPath - The catalogue's logo, for a title the library does not have.
 * @param isSeated - Whether a logo shorter than its space sits on what follows it rather than
 *   floating in the middle, so a thin wordmark leaves no gap beneath it.
 */
const TitleLockup = ({
  mediaId,
  name,
  hasLogo,
  logoPath = null,
  isSeated = false,
}: TitleLockupProps) => {
  const [hasNoLogo, setHasNoLogo] = useState(false);
  const path = mediaId === null ? logoPath : hasLogo ? titleLogoUrl(mediaId) : null;

  if (path === null || hasNoLogo) {
    return (
      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
    );
  }

  return (
    <Artwork
      path={path}
      fit="contain"
      anchor={isSeated ? 'bottomLeft' : 'left'}
      style={[LOGO, styles.logo]}
      onMissing={() => {
        setHasNoLogo(true);
      }}
    />
  );
};

TitleLockup.displayName = 'TitleLockup';

const styles = StyleSheet.create({
  logo: { backgroundColor: 'transparent' },
  name: { color: tokens.colours.text, fontSize: tokens.type.hero, fontWeight: '800' },
});

export { TitleLockup };
