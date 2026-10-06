import { ScrollView, StyleSheet, Text } from 'react-native';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { tokens } from '@ValenceTv/theme/tokens';
import type { SidePanelProps } from './SidePanel.types';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';

const WIDTH = 720;

/**
 * A panel down the right of the picture, over the film, that keeps the remote inside it until Menu
 * closes it: what it is at its head, and what it holds scrolling beneath.
 *
 * @param title - What it is.
 * @param children - What it holds.
 */
const SidePanel = ({ title, children }: SidePanelProps) => (
  <FocusGuide style={styles.panel} trapsLeft trapsRight trapsUp trapsDown>
    <FadeIn>
      <Text style={styles.title}>{title}</Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </FadeIn>
  </FocusGuide>
);

SidePanel.displayName = 'SidePanel';

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: WIDTH,
    paddingTop: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
    backgroundColor: 'rgba(12,12,12,0.92)',
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
    marginBottom: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  list: { gap: tokens.space.xs, paddingBottom: tokens.space.xl },
});

export { SidePanel };
