import { TypedSearch } from './components/TypedSearch/TypedSearch';
import type { SystemSearchProps } from './SystemSearch.types';

/**
 * Search for a television's browser, which has no system search screen: a field typed into with
 * the television's own keyboard, above the results.
 *
 * @param placeholder - What the field says while empty.
 * @param onChangeText - Told what has been typed.
 * @param onResultsLayout - Told how much room the results have.
 * @param children - The results.
 */
const SystemSearch = ({
  placeholder,
  onChangeText,
  onResultsLayout,
  children,
}: SystemSearchProps) => (
  <TypedSearch
    placeholder={placeholder}
    onChangeText={onChangeText}
    onResultsLayout={onResultsLayout}
  >
    {children}
  </TypedSearch>
);

SystemSearch.displayName = 'SystemSearch';

export { SystemSearch };
