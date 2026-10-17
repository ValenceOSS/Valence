import type { LibraryHealth } from '@ValenceContracts/schemas/LibraryHealth';

type LibraryHealthReader = () => Promise<LibraryHealth>;

export type { LibraryHealthReader };
