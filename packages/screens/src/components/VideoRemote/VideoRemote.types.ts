type VideoRemoteProps = {
  isOpen: boolean;
  onClose: () => void;
  onPlayHere: (mediaId: string, startSeconds: number) => void;
};

export type { VideoRemoteProps };
