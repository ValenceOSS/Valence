type AChapterToHearProps = {
  title: string;
  at: number;
  lasts: number;
  isCurrent: boolean;
  onListen: (at: number) => void;
};

export type { AChapterToHearProps };
