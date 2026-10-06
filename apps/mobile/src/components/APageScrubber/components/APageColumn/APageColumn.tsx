import { useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { ScrollView } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { say } from '@ValenceI18n/say';
import type { APageColumnProps } from './APageColumn.types';

const SWELL = 1.16;

const SHRINK = 0.26;

const DIM = 0.12;

const GAP = 8;

const CAPSULE = 'rgba(28, 28, 30, 0.72)';

const styles = StyleSheet.create({
  middle: { alignItems: 'center', justifyContent: 'center' },
  picture: { borderRadius: 10, overflow: 'hidden' },
});

/**
 * A column of a book's pages to scrub through, for a phone with no SwiftUI to draw the iPhone's:
 * the page in the middle drawn largest inside a ring that stays put, and the rest smaller and dimmer
 * the further off they are.
 *
 * It springs to the page showing whenever that changes from outside, unless it is being dragged,
 * and says which page was left in the middle once a drag or a tap comes to rest.
 *
 * @param pictures - A small picture of every page, in the book's order.
 * @param page - The page showing.
 * @param ink - The colour of the ring.
 * @param onPage - Told which page was left in the middle.
 * @param style - Where the column sits.
 */
const APageColumn = ({ pictures, page, ink, onPage, style }: APageColumnProps) => {
  const [room, setRoom] = useState({ height: 0, width: 0 });
  const capsule = Math.max(room.width - 16, 1);
  const across = Math.max(capsule - 12, 1);
  const high = Math.round(across * 1.42);
  const step = high + GAP;
  const margin = Math.max((room.height - step) / 2, 0);
  const [scrolled] = useState(() => new Animated.Value(0));
  const list = useRef<ComponentRef<typeof ScrollView>>(null);
  const isHeld = useRef(false);
  const centred = useRef(page);

  useEffect(() => {
    if (room.height === 0 || isHeld.current || centred.current === page) {
      return;
    }

    centred.current = page;
    list.current?.scrollTo({ y: page * step, animated: true });
  }, [page, step, room.height]);

  const settle = (offset: number) => {
    isHeld.current = false;

    const at = Math.min(pictures.length - 1, Math.max(0, Math.round(offset / step)));

    if (at !== centred.current) {
      centred.current = at;
      onPage(at);
    }
  };

  return (
    <View
      style={style}
      onLayout={({ nativeEvent }) => {
        setRoom({ height: nativeEvent.layout.height, width: nativeEvent.layout.width });
      }}
    >
      {room.height > 0 ? (
        <>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: CAPSULE,
                borderRadius: capsule / 2,
                left: (room.width - capsule) / 2,
                right: (room.width - capsule) / 2,
              },
            ]}
          />
          <Animated.ScrollView
            ref={list}
            showsVerticalScrollIndicator={false}
            snapToInterval={step}
            decelerationRate="fast"
            contentOffset={{ x: 0, y: page * step }}
            contentContainerStyle={{ paddingVertical: margin }}
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolled } } }], {
              useNativeDriver: true,
            })}
            onScrollBeginDrag={() => {
              isHeld.current = true;
            }}
            onMomentumScrollEnd={({ nativeEvent }) => {
              settle(nativeEvent.contentOffset.y);
            }}
          >
            {pictures.map((picture, at) => {
              const near = [at - 3, at - 1, at, at + 1, at + 3].map((one) => one * step);

              return (
                <Pressable
                  key={picture}
                  accessibilityRole="button"
                  accessibilityLabel={say('common.pageValue', { value: (at + 1).toString() })}
                  style={[styles.middle, { height: step, width: room.width }]}
                  onPress={() => {
                    list.current?.scrollTo({ y: at * step, animated: true });
                    settle(at * step);
                  }}
                >
                  <Animated.View
                    style={[
                      styles.picture,
                      {
                        height: high,
                        opacity: scrolled.interpolate({
                          inputRange: near,
                          outputRange: [1 - 3 * DIM, 1 - DIM, 1, 1 - DIM, 1 - 3 * DIM],
                          extrapolate: 'clamp',
                        }),
                        transform: [
                          {
                            scale: scrolled.interpolate({
                              inputRange: near,
                              outputRange: [
                                SWELL - SHRINK,
                                SWELL - SHRINK,
                                SWELL,
                                SWELL - SHRINK,
                                SWELL - SHRINK,
                              ],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                        width: across,
                      },
                    ]}
                  >
                    <ARemotePicture
                      uri={picture}
                      fit="cover"
                      style={{ height: high, width: across }}
                    />
                  </Animated.View>
                </Pressable>
              );
            })}
          </Animated.ScrollView>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.middle]}>
            <View
              style={{
                borderColor: withAlpha(ink, 0.9),
                borderRadius: 14,
                borderWidth: 2.5,
                height: high * SWELL + 10,
                width: across * SWELL + 10,
              }}
            />
          </View>
        </>
      ) : null}
    </View>
  );
};

APageColumn.displayName = 'APageColumn';

export { APageColumn };
