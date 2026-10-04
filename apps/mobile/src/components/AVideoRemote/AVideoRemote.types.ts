type AVideoRemoteProps = {
  isOpen: boolean;
  onClose: () => void;
  onPlayHere: (mediaId: string, startSeconds: number) => void;
};

export type { AVideoRemoteProps };
