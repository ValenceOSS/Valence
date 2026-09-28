type APluginPanelsProps = {
  on: 'title' | 'series' | 'album' | 'artist' | 'playlist';
  subjectId: string;
  onLookAt?: (mediaId: string) => void;
};

export type { APluginPanelsProps };
