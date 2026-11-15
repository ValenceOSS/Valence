import { createContext } from 'react';

const NOW_PLAYING = createContext<{ currentId: string | null; isPlaying: boolean }>({
  currentId: null,
  isPlaying: false,
});

export { NOW_PLAYING };
