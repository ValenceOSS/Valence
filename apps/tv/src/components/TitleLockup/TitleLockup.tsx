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
 */
const TitleLockup = ({ mediaId, name, hasLogo }: TitleLockupProps) => {
  const [hasNoLogo, setHasNoLogo] = useState(false);

  if (mediaId === null || !hasLogo || hasNoLogo) {
    return (
      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
    );
  }

  return (
    <Artwork
      path={titleLogoUrl(mediaId)}
      fit="contain"
      anchor="left"
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
