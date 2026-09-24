type ThePicture = {
  uri: string;
  isDrawn: boolean;
};

type APictureProps = {
  picture: ThePicture;
  onMissing: () => void;
};

export type { APictureProps, ThePicture };
