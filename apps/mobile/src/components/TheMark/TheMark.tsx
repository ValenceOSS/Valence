import { useState } from 'react';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ALayersMark } from '@ValenceMobile/components/ALayersMark/ALayersMark';
import { useTheBrand } from '@ValenceMobile/hooks/useTheBrand';
import { pictureOnThisServer } from '@ValenceMobile/platform/pictureOnThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheMarkProps } from './TheMark.types';
import { say } from '@ValenceI18n/say';

const WIDER_BY = 140 / 132;

/**
 * The server's mark, in the ink of the words around it, as the web draws it in the corner of its
 * bar: the logo an administrator gave the server, or Valence's layers where it has none or
 * the logo cannot be read.
 *
 * @param high - How tall it is.
 */
const TheMark = ({ high = 28 }: TheMarkProps) => {
  const colours = useTheColours();
  const brand = useTheBrand();
  const [missing, setMissing] = useState<string | null>(null);

  if (brand.logo !== null && brand.logo !== missing) {
    const logo = brand.logo;

    return (
      <ARemotePicture
        uri={pictureOnThisServer(logo)}
        fit="contain"
        style={{ width: high, height: high, borderRadius: 6 }}
        label={brand.name ?? say('common.valence')}
        onMissing={() => {
          setMissing(logo);
        }}
      />
    );
  }

  return (
    <ALayersMark
      width={high * WIDER_BY}
      height={high}
      ink={colours.text}
      label={say('common.valence')}
    />
  );
};

TheMark.displayName = 'TheMark';

export { TheMark };
