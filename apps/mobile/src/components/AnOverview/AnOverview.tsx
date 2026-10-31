import { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnOverviewProps } from './AnOverview.types';
import { say } from '@ValenceI18n/say';

const SHOWN = 3;

const styles = StyleSheet.create({
  more: { fontFamily: FONTS.sans.bold, fontSize: 15, marginTop: 6 },
});

/**
 * What a title is about, held to its first three lines with a word beneath saying there is more,
 * as a sheet on the phone holds a long passage; pressing it lets the rest open out, and pressing
 * again folds it back. It is laid out whole once to count its lines, and only held short if there are
 * more than fit.
 *
 * @param children - The passage.
 */
const AnOverview = ({ children }: AnOverviewProps) => {
  const colours = useTheColours();
  const [lines, setLines] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const isLong = lines > SHOWN;

  const words = (
    <View>
      <Words
        size="lead"
        tone="muted"
        onLines={(count) => {
          setLines((was) => (was === 0 ? count : was));
        }}
        {...(isLong && !isOpen ? { lines: SHOWN } : {})}
      >
        {children}
      </Words>

      {isLong && !isOpen ? (
        <Text style={[styles.more, { color: colours.text }]}>{say('common.more')}</Text>
      ) : null}
    </View>
  );

  return isLong ? (
    <Button
      tone="bare"
      label={isOpen ? children : say('common.readMore')}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen((was) => !was);
      }}
    >
      {words}
    </Button>
  ) : (
    words
  );
};

AnOverview.displayName = 'AnOverview';

export { AnOverview };
