import { requireNativeView } from 'expo';
import type { NativeTabBarProps, SystemTabBarProps } from './SystemTabBar.types';

const TheBar = requireNativeView<NativeTabBarProps>('ValenceTabBar');

/**
 * The system's own tab bar, and the only place it is drawn.
 *
 * @param tabs - The tabs, each with the SF Symbol it shows.
 * @param selected - Which one is showing.
 * @param accent - The colour of the one showing.
 * @param onSelect - Told which one somebody chose.
 * @param onMeasure - Told how tall the bar is, safe area and all.
 * @param onFaceAt - Told where on screen the tab drawn as a face shows it.
 * @param style - Where it sits.
 */
const SystemTabBar = ({
  tabs,
  selected,
  accent,
  onSelect,
  onMeasure,
  onFaceAt,
  style,
}: SystemTabBarProps) => (
  <TheBar
    tabs={tabs}
    selected={selected}
    accent={accent}
    style={style}
    onSelect={(event) => {
      onSelect(event.nativeEvent.id);
    }}
    onMeasure={(event) => {
      onMeasure(event.nativeEvent.height);
    }}
    onFaceAt={(event) => {
      onFaceAt?.(event.nativeEvent);
    }}
  />
);

SystemTabBar.displayName = 'SystemTabBar';

export { SystemTabBar };
