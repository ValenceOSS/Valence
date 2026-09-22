type ATitleProps = {
  mediaId: string;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onBack: () => void;
};

export type { ATitleProps };
