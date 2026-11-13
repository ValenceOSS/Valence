import { memo, useCallback, useState } from 'react';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import { framedPlacement } from '@ValenceMobile/pictures/framedPlacement';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PHOTO_FILTERS } from '@ValenceContracts/schemas/ViewerProfile';
import { toneOfFilter } from '@ValenceContracts/functions/toneOfFilter';
import { PHOTO_FILTER_NAMES } from '@ValenceClient/profiles/PHOTO_FILTER_NAMES';
import { ATonedPicture } from '@ValenceMobile/components/ATonedPicture/ATonedPicture';
import { AFaceChoice } from '@ValenceMobile/components/AFaceEditor/components/AFaceChoice/AFaceChoice';
import type { APhotoFiltersProps } from './APhotoFilters.types';
import { say } from '@ValenceI18n/say';

const CIRCLE = 64;

const styles = StyleSheet.create({
  filters: { paddingVertical: 2 },
  whole: { height: '100%', width: '100%' },
});

/**
 * The filters a photograph can be drawn in, each shown as the photograph itself in that filter, in
 * a row that scrolls sideways. Until there is a photograph each is an empty circle that cannot be
 * chosen. It is drawn again only when the photograph or the chosen filter changes, not as the
 * photograph is moved or zoomed above it, since each circle is the whole photograph drawn afresh;
 * the circles follow the framing a moment behind, at a lower priority than the picture being moved.
 *
 * @param uri - Where the photograph is, or nothing until there is one.
 * @param frame - Where it sits in its circle, so each shows the part the circle above does.
 * @param chosen - The filter it is drawn in now.
 * @param onChoose - Told a filter was chosen.
 */
const EveryFilter = ({ uri, frame, chosen, onChoose }: APhotoFiltersProps) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const measure = useCallback((measured: { width: number; height: number }) => {
    if (measured.width > 0 && measured.height > 0) {
      setSize((was) =>
        was?.width === measured.width && was.height === measured.height ? was : measured,
      );
    }
  }, []);

  return (
    <ScrollView
      horizontal
      scrollEnabled={uri !== null}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      {PHOTO_FILTERS.map((filter) => (
        <AFaceChoice
          key={filter}
          label={say(PHOTO_FILTER_NAMES[filter])}
          name={say(PHOTO_FILTER_NAMES[filter])}
          isChosen={filter === chosen}
          isDisabled={uri === null}
          onChoose={() => {
            onChoose(filter);
          }}
        >
          {uri === null ? null : (
            <View
              style={
                size === null
                  ? styles.whole
                  : framedPlacement(size, PICTURE_ASPECTS.face, frame, {
                      width: CIRCLE,
                      height: CIRCLE,
                    })
              }
            >
              <ATonedPicture
                uri={uri}
                tone={toneOfFilter(filter)}
                style={styles.whole}
                onLoad={measure}
              />
            </View>
          )}
        </AFaceChoice>
      ))}
    </ScrollView>
  );
};

const APhotoFilters = memo(EveryFilter);

APhotoFilters.displayName = 'APhotoFilters';

export { APhotoFilters };
