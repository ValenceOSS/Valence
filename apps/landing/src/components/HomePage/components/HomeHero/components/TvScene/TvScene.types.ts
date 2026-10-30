type TvSlide = {
  src: string;
  alt: string;
};

type TvSceneProps = {
  slides: readonly TvSlide[];
  active: number;
  className?: string;
};

export type { TvSceneProps, TvSlide };
