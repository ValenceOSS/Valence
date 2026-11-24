type APlayOnATelevisionProps = {
  media: { id: string; title: string };
  startSeconds: number;
  onSent: () => void;
};

export type { APlayOnATelevisionProps };
