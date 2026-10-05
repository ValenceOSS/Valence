import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import type { ALeafProps } from './ALeaf.types';

/**
 * One page of a book, its picture fitted to the leaf the way asked: whole, or filling the leaf's
 * width or its height with the rest scrolled to. A leaf with no picture is the blank page that pads
 * out a spread.
 *
 * Filling a side needs the picture's shape, so a page is shown whole until it has loaded and then
 * drawn out to fit.
 *
 * @param uri - The page's picture, or nothing for a blank leaf.
 * @param fit - How the picture fills the leaf.
 * @param breadth - How wide the leaf is.
 * @param tall - How tall the leaf is.
 */
const ALeaf = ({ uri, fit, breadth, tall }: ALeafProps) => {
  const [shape, setShape] = useState<number | null>(null);

  if (uri === null) {
    return <View style={{ height: tall, width: breadth }} />;
  }

  const learnShape = ({ width, height }: { width: number; height: number }) => {
    if (width > 0 && height > 0) {
      setShape(height / width);
    }
  };

  if (fit === 'both' || shape === null) {
    return (
      <ARemotePicture
        uri={uri}
        fit="contain"
        style={{ height: tall, width: breadth }}
        onLoad={learnShape}
      />
    );
  }

  if (fit === 'width') {
    return (
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={{ height: tall, width: breadth }}
        contentContainerStyle={{ justifyContent: 'center', minHeight: tall }}
      >
        <ARemotePicture
          uri={uri}
          fit="contain"
          style={{ height: breadth * shape, width: breadth }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={{ height: tall, width: breadth }}
      contentContainerStyle={{ alignItems: 'center', minWidth: breadth }}
    >
      <ARemotePicture uri={uri} fit="contain" style={{ height: tall, width: tall / shape }} />
    </ScrollView>
  );
};

ALeaf.displayName = 'ALeaf';

export { ALeaf };
