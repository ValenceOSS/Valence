import type { ArrImportLibrary } from '@ValenceContracts/schemas/ArrImport';

const LIBRARIES: readonly ArrImportLibrary[] = [
  {
    id: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
    name: 'Films',
    kind: 'movies',
    path: '/media/Films',
    requestPath: null,
  },
  {
    id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
    name: 'Series',
    kind: 'shows',
    path: '/media/Series',
    requestPath: null,
  },
  {
    id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
    name: 'Music',
    kind: 'music',
    path: '/media/Music',
    requestPath: '/media/Music/Requested',
  },
];

export { LIBRARIES };
