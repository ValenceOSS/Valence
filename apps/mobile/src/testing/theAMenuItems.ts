import { screen } from '@testing-library/react-native';

/**
 * The items of every menu that drops from what opens it, in the order they are drawn.
 *
 * @returns Each item's words.
 */
const theAMenuItems = (): string[] =>
  screen.container
    .queryAll((one) => 'onButtonPress' in one.props)
    .flatMap((one) => (typeof one.props.label === 'string' ? [one.props.label] : []));

export { theAMenuItems };
