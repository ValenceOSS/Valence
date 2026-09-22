import { Switch } from 'react-native';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { ToggleProps } from './Toggle.types';

/**
 * A switch, and the only place one is drawn.
 *
 * @param label - What it turns on, for somebody who cannot see it.
 * @param isOn - Whether it is.
 * @param onToggle - Told what it was turned to.
 * @param isDisabled - Whether it can be touched.
 */
const Toggle = ({ label, isOn, onToggle, isDisabled = false }: ToggleProps) => {
  const colours = useTheColours();

  return (
    <Switch
      accessibilityLabel={label}
      value={isOn}
      onValueChange={onToggle}
      disabled={isDisabled}
      trackColor={{ true: colours.accent, false: colours.border }}
    />
  );
};

Toggle.displayName = 'Toggle';

export { Toggle };
