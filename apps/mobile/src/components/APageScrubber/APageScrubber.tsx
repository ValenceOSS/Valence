import { useState } from 'react';
import { Host } from '@expo/ui/swift-ui';
import { requireNativeView } from 'expo';
import { View } from 'react-native';
import type { APageScrubberProps, NativePageScrubberProps } from './APageScrubber.types';

const TheColumn = requireNativeView<NativePageScrubberProps>('ValencePageScrubber', 'PageScrubber');

/**
 * A column of a book's pages to scrub through, drawn by SwiftUI on the system's glass: the page in
 * the middle largest, sharpest and ringed, the rest shrinking and blurring the further off they are.
 * It springs along as the book turns, and a drag or a tap on it turns the book.
 *
 * Being SwiftUI, it is laid inside a host that carries SwiftUI views into React Native's, and told
 * the room it has, which is measured here since SwiftUI inside the host is offered none.
 *
 * @param pictures - A small picture of every page.
 * @param page - The page showing.
 * @param ink - The colour of the ring.
 * @param onPage - Told the page left in the middle once the column comes to rest.
 * @param style - Where it sits.
 */
const APageScrubber = ({ onPage, style, ...rest }: APageScrubberProps) => {
  const [room, setRoom] = useState({ height: 0, width: 0 });

  return (
    <View
      style={style}
      onLayout={({ nativeEvent }) => {
        setRoom({ height: nativeEvent.layout.height, width: nativeEvent.layout.width });
      }}
    >
      {room.width > 0 && room.height > 0 ? (
        <Host style={room}>
          <TheColumn
            {...rest}
            breadth={room.width}
            tall={room.height}
            style={room}
            onPage={(event) => {
              onPage(event.nativeEvent.page);
            }}
          />
        </Host>
      ) : null}
    </View>
  );
};

APageScrubber.displayName = 'APageScrubber';

export { APageScrubber };
