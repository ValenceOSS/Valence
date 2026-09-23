import { requireNativeView } from 'expo';
import { z } from 'zod';
import type { NativeSearchProps, SystemSearchProps } from './SystemSearch.types';

const NativeSearch = requireNativeView<NativeSearchProps>('ValenceSearch');

const TypedSchema = z.object({ text: z.string() });

const RoomSchema = z.object({ width: z.number(), height: z.number() });

/**
 * The television's own search screen — its keyboard across the top, with dictation and the Remote
 * app's typing — with Valence's results drawn in the space beneath it, as every other app on the
 * television searches. The one component that draws that screen.
 *
 * The space beneath the keyboard is measured by the screen itself and told here, since the results
 * are laid out without knowing how much of the screen the keyboard takes.
 *
 * @param placeholder - What the search box says while empty.
 * @param onChangeText - Told what has been typed, each time it changes.
 * @param onResultsLayout - Told how much room the results have.
 * @param upTo - The React tag of where pressing up from the keyboard goes, since the search screen
 *   would keep the remote in the keyboard otherwise. A tag rather than the element itself, which is
 *   far too large to hand across to the native side.
 * @param children - The results.
 */
const SystemSearch = ({
  placeholder,
  onChangeText,
  onResultsLayout,
  upTo,
  children,
}: SystemSearchProps) => (
  <NativeSearch
    placeholder={placeholder}
    upTo={upTo}
    style={{ flex: 1 }}
    onChangeText={(event) => {
      const typed = TypedSchema.safeParse(event.nativeEvent);

      if (typed.success) {
        onChangeText(typed.data.text);
      }
    }}
    onResultsLayout={(event) => {
      const room = RoomSchema.safeParse(event.nativeEvent);

      if (room.success) {
        onResultsLayout(room.data);
      }
    }}
  >
    {children}
  </NativeSearch>
);

SystemSearch.displayName = 'SystemSearch';

export { SystemSearch };
