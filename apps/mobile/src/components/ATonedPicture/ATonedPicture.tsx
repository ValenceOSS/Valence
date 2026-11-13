import { memo, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Canvas, ColorMatrix, Image, Rect } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import { toneMatrix } from '@ValenceCore/pictures/toneMatrix';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { readSkiaPicture } from '@ValenceMobile/pictures/readSkiaPicture';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';
import type { ATonedPictureProps } from './ATonedPicture.types';

const BLENDS = {
  'soft-light': 'softLight',
  overlay: 'overlay',
  screen: 'screen',
  difference: 'difference',
} as const satisfies Record<NonNullable<PictureTone['layer']>['blend'], string>;

/**
 * Whether a tone leaves a picture exactly as it is.
 *
 * @param tone - The tone, or nothing.
 * @returns Whether there is nothing to draw differently.
 */
const changesNothing = (tone: PictureTone | null): boolean =>
  tone === null ||
  (tone.saturate === 1 &&
    tone.hueRotate === 0 &&
    tone.contrast === 1 &&
    tone.brightness === 1 &&
    tone.layer === null);

/**
 * A picture drawn in a filter, as the web and the server draw it, filling and cropping its box. The
 * phone's own views cannot change how colourful or contrasting a picture is on an iPhone, so a
 * filtered one is drawn by Skia instead: through one colour matrix made by the same sums, with the
 * filter's colour laid over it and blended. One with no filter is drawn as any other picture is. It
 * is drawn again only when what it shows changes, not each time what holds it is.
 *
 * @param uri - Where the picture is.
 * @param tone - The filter, or nothing to draw the picture as it is.
 * @param style - How big to draw it and where.
 * @param onLoad - Told how big the picture is once it has arrived.
 * @param onMissing - Told where the picture cannot be had.
 */
const OnePicture = ({ uri, tone, style, onLoad, onMissing }: ATonedPictureProps) => {
  const isPlain = changesNothing(tone);
  const [read, setRead] = useState<{ uri: string; image: SkImage } | null>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const told = useRef({ onLoad, onMissing });

  useEffect(() => {
    told.current = { onLoad, onMissing };
  }, [onLoad, onMissing]);

  useEffect(() => {
    if (isPlain) {
      return;
    }

    let isCurrent = true;

    void readSkiaPicture(uri).then((image) => {
      if (!isCurrent) {
        return;
      }

      if (image === null) {
        told.current.onMissing?.();

        return;
      }

      setRead({ uri, image });
      told.current.onLoad?.({ width: image.width(), height: image.height() });
    });

    return () => {
      isCurrent = false;
    };
  }, [uri, isPlain]);

  if (isPlain || tone === null) {
    return (
      <ARemotePicture
        uri={uri}
        style={style}
        {...(onLoad === undefined ? {} : { onLoad })}
        {...(onMissing === undefined ? {} : { onMissing })}
      />
    );
  }

  const image = read?.uri === uri ? read.image : null;

  return (
    <View
      style={style}
      onLayout={({ nativeEvent }) => {
        setBox({ width: nativeEvent.layout.width, height: nativeEvent.layout.height });
      }}
    >
      {image === null || box === null ? null : (
        <Canvas style={{ width: box.width, height: box.height }}>
          <Image image={image} x={0} y={0} width={box.width} height={box.height} fit="cover">
            <ColorMatrix matrix={toneMatrix(tone)} />
          </Image>
          {tone.layer === null ? null : (
            <Rect
              x={0}
              y={0}
              width={box.width}
              height={box.height}
              color={tone.layer.colour}
              opacity={tone.layer.opacity}
              blendMode={BLENDS[tone.layer.blend]}
            />
          )}
        </Canvas>
      )}
    </View>
  );
};

const ATonedPicture = memo(OnePicture);

ATonedPicture.displayName = 'ATonedPicture';

export { ATonedPicture };
