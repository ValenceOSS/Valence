type HeroShot = {
  id: string;
  src: string;
  alt: string;
};

type HeroWindowProps = {
  shots: readonly HeroShot[];
  active: number;
  isStill: boolean;
  className?: string;
};

export type { HeroShot, HeroWindowProps };
