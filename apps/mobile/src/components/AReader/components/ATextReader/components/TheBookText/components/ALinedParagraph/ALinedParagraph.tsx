import { useState } from 'react';
import { View } from 'react-native';
import type { ALinedParagraphProps } from './ALinedParagraph.types';

/**
 * Holds a paragraph to a whole number of lines. The system rounds a paragraph's height up to the
 * next pixel, a third of a point more than its lines on most phones, and over a chapter those
 * thirds add up until a page breaks through the middle of a line; measured and held to its lines,
 * every paragraph starts where the one before ends on the page's grid of lines.
 *
 * @param line - The height of a line.
 * @param children - The paragraph.
 */
const ALinedParagraph = ({ line, children }: ALinedParagraphProps) => {
  const [lines, setLines] = useState<number | null>(null);

  return (
    <View style={lines === null ? null : { height: lines * line }}>
      <View
        onLayout={({ nativeEvent }) => {
          setLines(Math.max(Math.round(nativeEvent.layout.height / line), 1));
        }}
      >
        {children}
      </View>
    </View>
  );
};

ALinedParagraph.displayName = 'ALinedParagraph';

export { ALinedParagraph };
