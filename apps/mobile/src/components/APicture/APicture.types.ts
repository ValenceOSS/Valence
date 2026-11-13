type ThePicture = {
  uri: string;
  isDrawn: boolean;
};

type APictureProps = {
  picture: ThePicture;
  onMissing: () => void;
  onLoad?: (size?: { width: number; height: number }) => void;
};

export type { APictureProps, ThePicture };
