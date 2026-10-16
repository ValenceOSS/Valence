import { createContext } from 'react';
import type { Place } from '@ValenceClient/navigation/readLocation';

const HrefOf = createContext<((change: Partial<Place>) => string) | null>(null);

export { HrefOf };
