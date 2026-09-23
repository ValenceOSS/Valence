import type { MusicView } from '@ValenceClient/music/musicView';

type ListenedView = Extract<MusicView, { kind: 'album' | 'artist' | 'playlist' | 'liked' }>;

export type { ListenedView };
