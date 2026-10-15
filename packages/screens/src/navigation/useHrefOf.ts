import { useContext } from 'react';
import { HrefOf } from '@ValenceScreens/navigation/HrefOf';
import type { Place } from '@ValenceClient/navigation/readLocation';

/**
 * How to write the address a move would lead to, so whatever goes somewhere can be a real link a
 * person can middle-click, open in a new tab or copy. Nothing outside the shell that knows where the
 * application is, where a control falls back to being a button.
 *
 * @returns The way to write an address, or null where there is no shell to ask.
 */
const useHrefOf = (): ((change: Partial<Place>) => string) | null => useContext(HrefOf);

export { useHrefOf };
