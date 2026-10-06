import { findNodeHandle } from 'react-native';
import type { View } from 'react-native';

/**
 * The number the television's native views know a view by, for a native view that has to point at
 * it, such as the search screen sending the remote up to the bar.
 *
 * @param view - The view.
 * @returns Its number, or nothing for no view.
 */
const nativeTagOf = (view: View | null): number | null =>
  view === null ? null : findNodeHandle(view);

export { nativeTagOf };
