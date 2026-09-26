import { Dimensions } from 'react-native';

/**
 * Makes the app's window this many points across and down, for code that asks how big it is.
 * React Native's own stand-in answers 750 by 1334, larger both ways than any phone held upright.
 *
 * @param width - How wide the window is.
 * @param height - How tall the window is.
 */
const holdAWindowOf = (width: number, height: number): void => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 3, fontScale: 1 });
};

export { holdAWindowOf };
